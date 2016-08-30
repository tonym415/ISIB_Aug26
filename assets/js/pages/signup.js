/**
* @fileOverview Handles js interaction for the signup page
* The signup module controls the signup/registration page on the site
* It is separated so that the code can be called on any appropriate (pages
* viewed by unauthorize access)
*
* This module handles:
* -  submission of registration data
* -  validation of the registration form
* - username availability check
* @module signup
* @author Tony Moses
* @version 0.1
 */
require(['jquery','app' ,  'validate','jqueryUI', 'steps'], function($, app){
    /**
     * namespace for dom element event attachment
     * @namespace element
     */

    /**
     *  Submits an ajax call to send signup info to the database
     *  @method submitUserInfo
     *  @param {object} data Form info used to register user
     */
     function submitUserInfo(data){
        $.ajax({
            contentType: "application/x-www-form-urlencoded",
            desc: "Submit User information for registration",
            data: data,
            type: "POST",
            url: app.engine
        })
        .done(function(result){
            if (typeof(result) !== 'object'){
                result = JSON.parse(result)[0];
            }

            // internal error handling
            if (result.error !== undefined){
                var validator = $("#signup").validate();
                validator.showErrors({
                    "paypal_account": result.error
                });
            }else{
                // set user name to login screen
                $('#login #username').val(result.username);
                // show login screen
                $('.modal-container')
                    .tabs({ active: 0}) // show login with username filled in
                    .dialog('open');
                $('#login #password').focus();
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) { console.log('getJSON request failed! ' + textStatus); })
        .always(function() { /*console.log('getJSON request ended!');*/ });
     }


     /**
        Used in conjunction with {@link module:login Login Module} and {@link module:main Signup Module}

     * Initializes form with jquery plugins ([steps]{@link steps} and [validate]{@link validate})
     * to set the ui and events of the form while activate the validator
     * @param {jQuery} form jquery form element
     */
    $('#signup')
        /**
         * @desc Specific config options and event handling
         */
        .steps({
            headerTag: 'h1',
            bodyTag: 'fieldset',
            transitionEffect: 'slideLeft',
            stepsOrientation: 'vertical',
            onStepChanging: function (event, currentIndex, newIndex) {
                // Always allow going backward even if the current step contains invalid fields!
                if (currentIndex > newIndex) return true;
                var form = $(this);

                // Clean up if user went backward before
                if (currentIndex < newIndex) {
                    // To remove error styles
                    $(".body:eq(" + newIndex + ") label.error", form).remove();
                    $(".body:eq(" + newIndex + ") .error", form).removeClass("error");
                }

                // Disable validation on fields that are disabled or hidden.
                form.validate().settings.ignore = ":disabled,:hidden";

                // Start validation; Prevent going forward if false
                return form.valid();
            },
            onStepChanged: function (event, currentIndex, priorIndex) { },
            onFinishing: function (event, currentIndex) {
                var form = $(this);

                // Disable validation on fields that are disabled.
                // At this point it's recommended to do an overall check (mean ignoring only disabled fields)
                form.validate().settings.ignore = ":disabled";

                // check to see if player has read the rules and regulations
                if ($('#rulesChk').is(':disabled')){
                    app.dMessage("Alert", "You must read the rules and regulations first!");
                    return false;
                }else{
                    return $('#rulesChk').is(':checked');
                }

            },
            onFinished: function (event, currentIndex) {$(this).submit();}
        })
        .validate({
            debug: true,
            submitHandler: function(){
                formData = $(this.currentForm).serializeForm();
                formData['function'] = "SUI";
                submitUserInfo(formData);
            },
            rules: {
                first_name: "required",
                last_name: "required",
                username: {
                    required: true,
                    minlength: 3
                },
                password: {
                    required: true,
                    minlength: 5
                },
                confirm_password: {
                    required: true,
                    minlength: 5,
                    equalTo: $("#signup #password")
                },
                email: {
                    required: true,
                    email: true
                },
                paypal_account: {
                    required: true,
                    minlength: 2
                },
                rulesChk: {
                    required: {
                        depends: function(element){
                            disabled = $('#rulesChk').is(':disabled');
                            checked = $('#rulesChk').is(':checked');
                            // return (!disabled && checked);
                            return false;
                        }
                    }
                }
            },
            messages: {
                first_name: "Please enter your first name",
                last_name: "Please enter your last name",
                username: {
                    required: "Please enter a username",
                    minlength: "Your username must consist of at least 3 characters"
                },
                password: {
                    required: "Please provide a password",
                    minlength: "Your password must be at least 5 characters long"
                },
                confirm_password: {
                    required: "Please reenter password from above",
                    minlength: "Your password must be at least 5 characters long",
                    equalTo: "Please enter the same password as above"
                },
                email: {
                    required: "Please enter a valid email address",
                    email: "Your email address must be in the format of name@domain.com"
                },
                rulesChk: {
                    required: "You must read the rules and regulations first!"
                }
            }
        });

    /**
     * <h3>Event Listener</h3>
     * clear availibility validations
     * @listens element#blur
     * @param {blur} sigup#username username field in form
     */
    $("#signup #username").on('blur', function(){
        $('#username_availability_result').empty();
    });

     /**
     * <h3>Event Listener</h3>
     * check username availability
     * @listens element#keyup
     * @param {keyup} sigup#username username field in form
     */
    $("#signup #username").on('keyup', function(){
        username = $(this).val();
        minChars = 3;
        // if the input is the correct length check for availability
        if (username.length >= minChars){
            $("#username_availability_result").html('Checking availability...');
            data = { "function": "UAC", "username" : username };
             //use ajax to run the check
            $.ajax({
                    contentType: "application/x-www-form-urlencoded",
                    desc: "UserName availability",
                    data: data,
                    type: "POST",
                    url: app.engine
                })
            .done(function(result){
                availability = (result.available == "0") ? " is Available" : " is not Available";
                $('#username_availability_result').html(username + availability);
            })
            .fail(function(jqXHR, textStatus, error){
                var err = textStatus + ", " + error;
                console.log("Response: " + jqXHR.responseText);
                console.log("Request Failed: " + err);
            });
        }
    });
});
