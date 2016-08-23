/**
* @fileOverview  Handles js interaction for the login page
  Used in conjunction with {@link module:signup Signup Module} and {@link module:main Main Module}
* @module login
* @author Tony Moses
* @version 0.1
*/
define(['jquery', 'validate', 'app', 'jqueryUI', 'cookie'], function($, validate, app){
    // app.init('home');


    var user = app.getCookie('user');
    if (user !== undefined){
        // if same session USERNAME should be set
        name = user.username;
        if (name === 'undefined') {
            // if coming from registration page
            name = user.username;
            $("#password").val(user.password);
        }
        $("#username").val(name);
    }

    var valHandler = function(){
        formData = $('#login').serializeForm();
        formData.function = 'VU';

        // validate user
        $.ajax({
            contentType : "application/x-www-form-urlencoded",
            desc        : 'Login',
            data        : formData,
            type        : "POST",
            url         : app.engine
        })
        .done(function(result){
            //if ($.isEmptyObject(result)){
            if (typeof result == "string" || $.isEmptyObject(result)){
                var validator = $("#login").validate();
                validator.showErrors({
                    "username": "Invalid User/Password combination<br /> Try <a href='" + app.pages.registration + "'>creating a user</a>"
                });
                app.dMessage("Error", result);
            }else{
                // create cookie using user info
                // console.log(result)
                app.setCookie('user', result[0]);
                window.location.assign(app.pages.game);
            }
        })
        .fail(function(jqXHR, textStatus, error){
            var err = textStatus + ", " + error;
            console.log("Response: " + jqXHR.responseText);
            console.log("Request Failed: " + err);
        });
    };
    /**
     * HTML containing login form
     * @namespace loginForm
     */
    $("#login")
        /**
           login form validations
         * @namespace validator
         * @memberOf module:login~loginForm
         */
        .validate({
            /**
             * Callback for login submission
             * @function submitHandler
             * @memberOf module:login~loginForm.validator
             */
            submitHandler: valHandler,
            /**
             * Roles for form elements
             * @enum {object}
             * @name rules
             * @memberOf module:login~loginForm.validator
             */
            rules: {
                username: {
                    required: true,
                    minlength: 3
                },
                password: {
                    required: true,
                    minlength: 5,
                    maxlength: 12
                }
            },
            /**
             * Default validation messages
             * @type {object}
             * @name messages
             * @memberOf module:login~loginForm.validator
             */
            messages: {
                username: {
                    required: " (required)",
                    minlength: " (must be at least 3 characters)"
                },
                password: {
                    required: " (required)",
                    minlength: " (must be between 5 and 12 characters)",
                    maxlength: " (must be between 5 and 12 characters)"
                }
            }
        });
});
