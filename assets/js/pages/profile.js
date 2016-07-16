/**
* @fileOverview  Handles js interaction for the signup page
* @module profile
* @author Tony Moses
* @version 0.1
*/
require([
    'jquery',
    'app',
    'validate',
    'jqueryUI',
    'steps',
    'additional_methods',
    'fileInput',
    'bootstrap'
    ], function($, app, Avatar){
    // page set up
    app.init('profile');
    var user = app.getCookie('user');

    // uneditable fields in the form
    disabled_fields = ['username', 'created'];
    $.each(disabled_fields, function(idx, value){
        $("input[name='" + value + "']").attr("disabled", true);
    });

    /**
     * Ajax function updates profile information for player
     * @method updateUserInfo
     * @param {object} data form data
     */
    function updateUserInfo(data){
        $.ajax({
            url: app.engine,
            data: data,
            type: 'POST',
            dataType: 'json',
            desc: 'Update Profile',
            success: function(result){
                if (result.data === "Success")
                msgOpt = {
                        buttons: {
                            Ok: function(){
                                updateCookie(data);
                                $(this).dialog('close');
                            }
                        }
                    };
                app.dMessage(result.data, "Profile successfully saved!", msgOpt);
            }
        });
    }

    /**
     * Update user cookie to include relavant
     * @method updateCookie
     * @param {object} data form data
     */
    function updateCookie(data){
        data.function = 'GCU';
        data.username = $('#username').val();
        $.ajax({
            desc: 'Get Cookie',
            data: data,
            type: "POST",
            url: app.engine
        })
        .done(function(result){
            // create cookie using user info
            app.setCookie('user', result[0]);
            window.location.assign(app.pages.profile);
        });
    }

    /*
     * Gathers form data and sanitizes form data to remove password info if neccasary
     * @method
     */
    function getProfileData(){
        formData = $('form').serializeForm();
        // filesList = ($('#avatar').val() !== "") ? $('#avatar')[0].files : null;
        // formData.file = filesList;
        formData.function = "UP";
        formData.user_id = user.user_id;

        // sanitize data
        if (formData.origpassword === "" && formData.newpassword === "" && formData.confirmpassword === ""){
            delete formData.origpassword;
            delete formData.newpassword;
            delete formData.confirmpassword;
        }
        return formData;
    }

    /**
     * Initializes form with jquery plugins ([steps]{@link $.fn.steps} and [validate]{@link $.fn.validate})
     * to set the ui and events of the form while activate the validator
     * @namespace profileForm
     * @param {jQuery} form jquery form element
     */
    $("form")
        /**  Initializes steps wizard of sigup form
         * @namespace steps
         * @memberof module:profile~profileForm
         * @see $.fn.steps
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
            if (currentIndex < newIndex)
            {
                // To remove error styles
                $(".body:eq(" + newIndex + ") label.error", form).remove();
                $(".body:eq(" + newIndex + ") .error", form).removeClass("error");
            }

            // Disable validation on fields that are disabled or hidden.
            form.validate().settings.ignore = ":disabled,:hidden";

            // Start validation; Prevent going forward if false
            return form.valid();
        },
        onStepChanged: function (event, currentIndex, priorIndex) {
            // remove .clearfix class (bad css effect)
            $('.content .clearfix').each(function(){
                if(!$(this).parent().hasClass('[class^=file]')){
                    $(this).removeClass('clearfix');
                }
            });
        },
        onFinishing: function (event, currentIndex) {
            var form = $(this);

            // Disable validation on fields that are disabled.
            // At this point it's recommended to do an overall check (mean ignoring only disabled fields)
            form.validate().settings.ignore = ":disabled";

            // Start validation; Prevent form submission if false
            return form.valid();
        },
        onFinished: function (event, currentIndex) {
                var form = $(this);

                // Submit form input
                form.submit();
            }
     })
     /** validate profile form submit
     * @namespace validator
     * @implements $.fn.validate
     * @memberof module:profile~profileForm
     */
     .validate({
        /**
         * Callback for handling profileForm.
         * @function submitHandler
         * @memberof module:profile~profileForm.validator
         * @param {element} form
         */
         submitHandler: function(){
            // if avatar chosen...
            uLoad = $('.file-input-ajax-new').val();
            if (uLoad === undefined){
                $('#avatar').fileinput('upload');
                window.location.assign(app.pages.profile);
            }else{
                // manually upload form
                updateUserInfo(getProfileData());
            }
        },
        /**
         * @enum {object}
         * @memberof module:profile~profileForm.validator
        */
        rules: {
            first_name: "required",
            last_name: "required",
            username: {
                required: true,
                minlength: 3
            },
            origpassword: {
                minlength: 5,
                required: {
                    depends: function(element){
                        return $('#togPass').is(':checked');
                    }
                }
            },
            newpassword: {
                minlength: 5,
                required: {
                    depends: function(element){
                        return $('#togPass').is(':checked');
                    }
                }
            },
            confirmpassword: {
                minlength: 5,
                required:{
                    depends: function(element){
                        value = ($(element).val() == $('#newpassword').val());
                        togged = $('#togPass').is(':checked');
                        return togged && value;
                    }
                }
            },
            email: {
                required: true,
                email: true
            },
            paypal_account: {
                required: true,
                minlength: 2
            },
            uploader: {
                accept: "image/*",
                required: {
                    depends: function(element){
                        return ($(element).val() !== "");
                    }
                }
            }
        },
        /**
         * @enum {object}
         * @memberof module:profile~profileForm.validator
        */
        messages: {
            first_name: "Please enter your first name",
            last_name: "Please enter your last name",
            username: {
                required: "Please enter a username",
                minlength: "Your username must consist of at least 3 characters"
            },
            origpassword: {
                required: "Please provide the original password",
                minlength: "Your password must be at least 5 characters long"
            },
            newpassword: {
                required: "Please provide new password",
                minlength: "Your password must be at least 5 characters long"
            },
            confirmpassword: {
                required: "Please confirm new password",
                minlength: "Your password must be at least 5 characters long",
                equalTo: "Please enter the same password as above"
            },
            email: {
                required: "Please enter a valid email address",
                email: "Your email address must be in the format of name@domain.com"
            },
            uploader: {
                accept: "You tried to upload an invalid file type"
            }
        }
    });

    /**
     * @see $.fn.fileinput.upload
     * @event module:profile#fileinput_upload
     * @param {event} event
     * @param {object} data This is a data object that sends the following information
     * @param {string} previwId the identifier of each file's parent thumnail div element in the preview windo
     * @param {number} index the zero-based index of teh file in the stack
     * @listens $.fn.fileinput#fileuploaderror
     * @listens $.fn.fileinput#fileuploaded
     */
    $('#uploader')
        .on('fileuploaderror', function(event, data, previewId, index) {
            var form = data.form, files = data.files, extra = data.extra,
                response = data.response, reader = data.reader;
                app.dMessage("Error", response);
        })
        .on('fileuploaded', function(event, data, previewId, index) {
           var form = data.form, files = data.files, extra = data.extra,
            response = data.response, reader = data.reader;
            app.dMessage("Success", extra.bdInteli + " " +  response.uploaded);
        });

    // ...more page set up
    /**
     *
     * Load form with player information
     * @method <anonymous>
     */
    (function(){
        /**
         * Ajax data
         * @enum {object}
         */
        var fdata = {'function': 'GUP', 'id':'getUser', 'user_id': user.user_id };
        $.ajax({
            url: app.engine,
            data: fdata,
            type: 'POST',
            success: function(result){
                if (result.data !== undefined){
                    avInit = false;
                    $.each(result.data, function(key, value){
                        if (key === 'avatar'){
                            initAvatar();
                        }else{
                            element = $("#" + key);
                            if (element.length > 0){ element.val(value); }
                        }
                    });
                    if (!avInit) initAvatar();
                }
            }
        });
    })();



    /**
     * Constructs the Avatar uploader
     * @method initAvatar
     */
    function initAvatar(){
        avInit = true;
        /**
         * Constructs the Avatar uploader
           @enum
         * @memberof $.fn.fileinput
         * @see http://plugins.krajee.com/file-input#ajax-async
         */
        var fileinputConfig = {
            /** @type {boolean} */
            showPreview: true,
            /** @type {boolean} */
            uploadAsync: true,
            /** @type {string} */
            uploadUrl: app.engine,
            /** @type {object}  */
            uploadExtraData: getProfileData,
            /** @type {boolean} */
            overwriteInitial: true,
            /** @type {number} */
            maxFileSize: 1500,
            /** @type {boolean} */
            showClose: false,
            /** @type {boolean} */
            showCaption: false,
            /** @type {string} */
            browseLabel: ' ',
            /** @type {string} */
            removeLabel: ' ',
            /** @type {string} */
            browseIcon: '<i class="glyphicon glyphicon-folder-open"></i>',
            /** @type {string} */
            removeIcon: '<i class="glyphicon glyphicon-remove"></i>',
            /** @type {string} */
            removeTitle: 'Cancel or reset changes',
            /** @type {element} */
            elErrorContainer: '#kv-avatar-errors',
            /** @type {string} */
            msgErrorClass: 'alert alert-block alert-danger',
            /** @type {string}  */
            defaultPreviewContent: '<img src="' + app.getAvatar() + '" alt="Your Avatar" class="avatar">',
            /** @type {object} */
            layoutTemplates: {main2: '{preview}  {remove} {browse}'},
            /** @type {array} */
            allowedFileExtensions: ["jpg", "png", "gif"]
        }
        $('#avatar').fileinput(fileinputConfig);
    }

    /* preview selected theme */
    current_theme = (app.getTheme() === undefined) ? app.defaultTheme : app.getTheme();
    var selector = "#theme option[value='" + current_theme + "']";
    if (current_theme !== undefined) {  $(selector).prop('selected', true);}
    $('#theme').selectmenu({
        width: 200,
        change: function(){
            app.setTheme($(this).val());
        }
    });

    $('#togPass')
        /**
         * toggle password change fieldset
         * @event module:profile#togPass_change
         */
        .on('change', function(){
            $(this).parent().parent().siblings().slideToggle('slow');
        }).parent().parent().siblings().hide();

        
    $('#payPalButton').on('click', function() {
        $('#paypalPlaceholder').load('templates.html .payPalSnippet', function(response, status, xhr){
            if (status != 'error'){
               $(".payPalSnippet").dialog({
                        // resizable: false,
                        autoResize: true,
                        //autoOpen: false,
                        minHeight: "auto",
                        closeOnEscape: true,
                        dialogClass: 'no-close',
                        modal: true,
                        width: 'auto',
                        height: 'auto',
                        buttons: {
                            Close: function () {
                                $(this).dialog("close");
                            }
                        }
                    });
                }
        })
            })
});


