/**
 * @fileoverview
 * This module sets up a global object used in the application
 * It also has the global non page-specific setup for the site pages
 * I contains function for:
 * - banner creation and event linking
 *
 * Places of interest as of 24Jan16
 *   - See {@link module:app/appLib} for all "lib" interaction
 *    - [Navigation Bar]{@link module:app~loginNavBar}
 * @module appModule
 */
define([
    'jquery',
    'appLib',
    'facebook',
    'ud_facebook',
    'cookie',
    'blockUI',
    'jqueryUI',
    'bootstrap',
    'additional_methods'], function($, lib, FB, udFB){
    /**
     * Namespace for attaching events
     * @private
     * @namespace document
     */

       /**#@+
     * @private
     * @memberof app
    */
    var objCategories = {},
        testBtnDialog,
        selectMenuOpt = { width: '65%'},
        tabOptions = {
            active: false,
            collapsible: true,
            heightStyle: 'content',
            hide: { effect: "explode", duration: 1000 },
            show: { effect: "slide", duration: 800 }
        };

    /**
     * Sets default loading message and initializes modal notification
     * @method loading
     * @param {string} msg Message string
     */
    var loading = function(msg){
        loadingImg = '<img src="assets/css/images/loading.gif" />';
        loadingHtml = ' <h3>We are processing your request.  Please be patient.</h3>';
        msg =  (msg === undefined) ?  loadingImg + loadingHtml : loadingImg + msg;
        $.blockUI({message: msg});
    };

    /**
     * Unblock the ui after system messages
     * @method unloading
     */
    var unloading = function(element){
        var data = $(window).data();

        if (data['blockUI.isBlocked'] == 1) {
            $('#content').unblock();
        }
        $.unblockUI();
    };

    $(document)
       /**
         * Add event to enable test buttons on page
         * @event module:game#document_test_click
         * @TODO following event must be commented for production
         */
        .on('click', '.test', function(){ app.toggleTestButtons(); })
        .on('click', '.main-nav',function(event){
            user = app.getCookie('user');
            signup = $(event.target).is('.cd-signup');
            if (signup) app.agreement();

            signin = $(event.target).is('.cd-signin');
            // function helper to show signin panel
            if (signup || signin){
                index = (signup) ? 1 : 0;
                // if the signup element has not been created
                if (!$('.modal-container').length){
                    app.createLoginDialog();
                }else{
                    app.showLoginDialog(index);
                }
            }
        })
        /**
         * Adds loading message to all ajax calls by default
         * @event module:appModule#document_ajaxStart
         */
        .ajaxStart(function(event, xhr, options) {
            loading();
        })
        /**
         * Logs ajax call and result
         * @event module:appModule#document_ajaxComplete
         */
        .ajaxComplete(function(event, xhr, options) {
            // if options.function == logger or utility...don't log
            if (options.function === undefined){
                // if (options.desc === undefined) return false;
                user = app.getCookie("user");
                if (typeof(options.data) === 'object') options.data = JSON.stringify(options.data);
                data = {
                    'function': 'LOG',
                    'user_id': (user === undefined) ? 0 : user.user_id,
                    'description': options.desc || 'utility function',
                    'action' : options.data || 'utility data',
                    'result' : xhr.responseText,
                    'detail' : options.url + " | " + xhr.status + " | " + xhr.statusText
                };
                // log event
                $.ajax({
                    contentType: "application/x-www-form-urlencoded",
                    function: 'logger',
                    data: data,
                    type: "POST",
                    url: app.engine
                    })
                    .done(function(data, textStatus, jqXHR){
                        // NOTE: comment line below for production
                        // console.log("Logged data: " + JSON.stringify(data, null, 4));
                    })
                    .fail(function(jqXHR, textStatus, errorThrown) { console.log('log request failed! ' + textStatus); })
                    .always(function() { return false; });
            }
            unloading();
        })
        /**
         * Removes modal message
         * @event module:appModule#document_ajaxError
         */
        .ajaxError(function(event, xhr, options) {
            unloading();
        });


        /**
     * Build rankings element
     * @method showRanking
     */
    function showRanking(){
        if ($('div#ranks').length === 0) {
            $('.footer')
                .append(
                    $('<div id="ranks" />')
                        .append(
                            $('<div />')
                                .addClass('center-content')
                                .append('<h1>Rank Description</h1>')
                                .append('<dl />')
                    )
                );

            $.each(lib.skillLevels,function(idx, value){
                $('#ranks dl')
                        .append(
                            $('<dt />')
                                .append(
                                    $('<img src="/assets/css/images/trans1.png" />')
                                        .removeClass()
                                        .addClass('star' + (1 + idx)),
                                    $('<span>' + value.title + '</span>')
                                )
                        )
                        .append(
                            $('<dd />')
                                .html(value.description)
                        );
            });

            // let the user know that 0 stars and 1/2 star are equal rank
            $('dt:first')
                .prepend(
                    $('<img src="/assets/css/images/trans1.png" />')
                        .removeClass()
                        .addClass('star0')
                    ,$('<br />')
                )


            $('#ranks')
                .append("<a class='rank_close' href='#'>Close this dialog</a>");

            $('.rank_close').click(function(){
                event.preventDefault();
                $.unblockUI();
                $('#ranks').remove();
            });
        }
        $('#ranks').toggle(false);
        return $('#ranks');
    }

    /**
     * Base on this param, this function returns the correct skill level title using the [skillLevel object]{@link module:app/appLib~skillLevels}
     * @method getLevelName
     * @param {number} val
     */
    function getLevelName(val){
        // get the index of the skill level name
        idx = val % 100 / 10 | 0;
        return lib.skillLevels[idx].title;
    }

    /**
     * Sets Facebook "login button" click event
     * @method fbImage
     */
    function fbImage(){
        $("#fbButtonImage").on('click', function(){
            origSrc = $("#fbButtonImage").prop("src").split('/').pop()
            isLogginIn = origSrc.indexOf("IN") > 0
            if (isLogginIn){
                FB.login(function(response){
                    if (response.authResponse){
                        app.fbLogin(response);
                    }else{
                        app.dMessage("NOTICE", "User cancelled login or did not fully authorize.");
                    }
                });
            }else{
                app.showFBButton();
                udFB.fbLogout();
            }
        })
    }

    var app = {
        pages: lib.navPages,
        defaultTheme: 'ui-lightness',
        engine: "cgi-bin/engine.py",
        social: "cgi-bin/social.py",
        default_avatar: function(){
            // TODO: create random choice of default anonymous avatar (male/female)
            // - upload files
            // returns a 0 or a 1, each value just about half the time
            // -['filespec1','filespec2'][Math.round(Math.random())]
            //
            return 'assets/css/images/anon_user.png';
        },
        fbTest: udFB.checkLoginState,
        /**
         * @method init
         * @desc Initialization function for all pages
         * @param  {string} page code name for current pages
         * @return {boolean} If true show the login window
         */
        init: function(page){
            var returnValue,
                showLogin = false;
            // if not logged in send to login page
            user = this.getCookie('user');
            this.currentPage = page;

            // ensure player is logged in
            showLogin = this.ensureLogin(page, user);

            //  Initalize app setup functions
            this.setTheme();
            this.loginNavBar(page);

            // show active page
            $('.main-nav li').removeClass();
            $('#' + page).addClass('ui-state-active pageLinks');

            // page specific initialization
            switch (page) {
                case 'home':
                    $('.signin-message').toggle((user === undefined));
                    $("#reset-tab").toggle();
                    returnValue = showLogin;
                    break;
                case 'game':
                    $(".sel").selectmenu(selectMenuOpt);
                    // load category selectmenu
                    this.getCategories();
                    this.accordion = $("#accordion").accordion({ heightStyle: 'content', collapsable: true});
                    $("#debateResults").toggle();
                    // create counter for sub-category templates
                    $(document).data("tempCount",0);

                    // hide result pane till necessary
                    $('.debateVote').toggle();
                    $('#gameWait').toggle();
                    $('h3:contains("Game Results")').toggle();
                    $("h3:contains('Pre Game')").toggle();

                    // create param tabs
                    $('#paramOptions').tabs(tabOptions);
                    break;
                case 'admin':
                    // load category selectmenu
                    this.getCategories();
                    $('select').selectmenu(selectMenuOpt);
                    // create counter for sub-category templates
                    $(document).data("tempCount",0);
                    break;
                case 'feedback':
                    optCategory = {
                        change: function(){
                            // validate select
                            $(this).closest('form').validate().element(this);
                        }
                    };
                    settings = $.extend({}, selectMenuOpt, optCategory);
                    $(".sel").selectmenu(settings);
                    $("input").not('[type=submit]').width('110%');
                    break;
                default:

            }

            // jquery-fy page with Page Stylings
            var btnsettings = {'width': '9em', 'margin-top': '.5em' };
            $("input[type=submit], input[type=button]")
                .css(btnsettings)
                .button();

            // final page setup
            // add event listener for logout
            this.logout();
            this.setFooter();
            this.rankInfo();
            // initialize agreement module
            this.agreement();
            return returnValue;
        },
        /**
         * Use window location information to determine if login flag is needed
         * @method ensureLogin
         */
        ensureLogin: function(page, user){
            locParams = window.location;
            paths = locParams.pathname.split('/');
            webPage = paths[paths.length - 1];
            search = locParams.search.split('?')[1];
            showLogin = (webPage === this.pages.home && search !== undefined);

            // pages allowed to be viewed without logging in
            allowedPages = ['home', 'feedback', 'about'];
            // is current page on the VIP list?
            if (-1 == $.inArray(page, allowedPages) && !showLogin){
                // set location to home page with login flag
                if (user === undefined) window.location.assign(this.pages.home + "?true");
            }
            return showLogin;
        },
        /**
         * Universal function to create the footer
         * Uses template string from library to load footer {@link module:app/appLib~getFooterText}
         * @method setFooter
         */
        setFooter: function(){
            // NOTE: ids/classes are important progmatically (caution when changing)
            // wrap the content of the body with a container and wrap that with container to accomodate the footer stylings
            $('body').wrapInner("<div id='content'></div>");
            $('#content').wrap('<div id="container" />');
            $('<div class="footer"> </div>')
                .addClass('ui-state-default')
                .html(lib.getFooterText())
                .prepend( $('<div class="test" />') )
                .insertAfter('#container');
        },
        /**
         * Shows test buttons for the current page if any
         * @method toggleTestButtons
         *
        */
        toggleTestButtons: function(){
            btnContainer = $('#btnTest');

            if (btnContainer.length > 0){
                // create test button dialog
                  if (testBtnDialog === undefined){
                      btnContainer.toggleClass('no-display');
                      testBtnDialog = btnContainer.dialog({
                          title: "Test Buttons",
                          dialogClass: 'no-close',
                          hide: { effect: "fade", duration: 300 },
                          show: { effect: "fade", duration: 300 },
                          buttons: [{
                              text: 'Close',
                              click: function() {
                                  $(this).dialog('close');
                                  $('.test').html("");
                                  }
                          }]
                      });
                }else{
                    testBtnDialog.dialog('open');
                }
               $('.test').html("TEST TOGGLE");
            }
        },
        /**
         * Shows agreement window
         * @method agreement
         */
        agreement: function(){
            // make sure rules are read before 'agreeing'
            $('.rules').scroll(function(){
                if ($(this).scrollTop() + $(this).innerHeight() + 2 >= $(this)[0].scrollHeight){
                    $('#rulesChk').prop('disabled', false);
                    $('#rulesChk').prop('checked', true);
                }
            });

            $('.agreement_close').click(function(){
                event.preventDefault();
                $.unblockUI();
            });

            $('.agreement').click(function(){
                event.preventDefault();
                // open rules
                $.blockUI({
                    fadeIn: 1000,
                    css: {
                        top:  ($(window).height() - 500) /2 + 'px',
                        left: ($(window).width() - 500) /2 + 'px',
                        width: '500px'
                    },
                    message: $('.agreement_text'),
                    onOverlayClick: $.unblockUI
                });
            });
        },

        /**
         * Display rank info
         * @method rankInfo
         */
        rankInfo: function(){
            $('.rankInfo').click(function(){
                event.preventDefault();
                // open rank info
                $.blockUI({
                    fadeIn: 1000,
                    css: {
                        top:  ($(window).height() - 600) /2 + 'px',
                        left: ($(window).width() - 500) /2 + 'px',
                        width: '500px'
                    },
                    message: showRanking(),
                    onOverlayClick: function(){
                        $.unblockUI();
                        $('#ranks').remove();
                    }
                });
            });
        },
        /**
         * Gets avatar full path name for avatar
         * @method getAvatar
         * @param {string} avFilespec Name of file
         * @returns {string} Full file specification of avatar
         */
        getAvatar:function(avFilespec){
            if (avFilespec === undefined){
                info = app.getCookie('user');
                if (info.avatar && info.avatar.startsWith('https')) return info.avatar;
                return (info.avatar) ? '/assets/avatars/' + info.avatar : this.default_avatar();
            }else{
                return (avFilespec !== "") ? '/assets/avatars/' + avFilespec : this.default_avatar();
            }
        },

        /**
         * Handles logging user into the system based on facebook authentication
         * Post FB login procedures
         * @method fbLogin
         */
        fbLogin: function(response){
            console.log("FBLOGIN")
            /** send info to db */
            if (response.status === 'connected'){

                var queryFields = {fields : [
                    'email',
                    'first_name',
                    'last_name',
                    'birthday'
                ]}
                FB.api('/me', queryFields,  function(response){
                    // ensure all queried params are accounted for
                    verified = lib.objHasKeys(queryFields.fields, response)
                    if ($.inArray('email',verified.missing) > -1){
                        FB.login(
                            function(response){
                                console.log(response);
                            },{scope: 'email', auth_type: 'rerequest'}
                        );
                    }

                    //add server side params
                    response.fb_id = response.id;
                    response.id = 'fbLogin';
                    response.function = "userFunctions"
                    $.ajax({
                        desc: 'Login FB User',
                        data: response,
                        type: "POST",
                        url: app.engine
                        })
                        .done(function(data, textStatus, jqXHR){
                            // check return data for server issues
                            if (typeof(data) === 'object'){
                                info = data[0]
                                app.setCookie('user',info);
                                window.location.assign(app.pages.game);
                            }else if (typeof(data) === 'string'){
                                app.dMessage('Error', data)
                            }
                        });
                })
            }
        },
        /**
         * Logout
         * @method logout
         */
        logout: function(){
            app = this;
            $('.logout').on('click', function(e){
                e.preventDefault();
                $.cookie('fb_id',null);
                $.cookie('user',null);
                $.removeCookie('fb_id');
                $.removeCookie('user');
                udFB.fbLogout();
                window.location.assign(app.pages.home);
            });
        },
        /**
         *  Uses parameter to appropriately set the navigation bar
         * See {@link module:app/appLib~navPages} for param (page) reference
         * @method loginNavBar
         * @param {string} page Page key from library
         */
        loginNavBar: function(page){
            // logged in user
            app = this;
            info = app.getCookie('user');
            /**  */
            for(var key in lib.navPages){
                // don't show links if not logged in
                if (info === undefined){
                    if (key == 'profile') $('#' + key).toggle();
                    if (key == 'admin')  $('#' + key).toggle();
                    if (key == 'game')  $('#' + key).toggle();
                }else{
                    // don't show admin to reg user
                    if (key == 'admin' && info.role == 'user')  $('#' + key).toggle();
                    if (key == 'registration')  $('#' + key).toggle();
                }
            }

            if (info){
                // hide signin/signup
                $('.cd-signin, .cd-signup').toggle();
                userSpan = "<span id='welcome' class='ui-widget'>Welcome, <a href='" +  lib.navPages.profile + "'>   "  + info.username  ;
                userSpan += "<img src='" + app.getAvatar() + "' title='Edit " + info.username + "' class='avatar_icon' id='user_avatar'></a>";
                userSpan += "<br /><span class='skill_level ui-widget'><span class='skill_level_text rankInfo'>Level</span>:<img src='/assets/css/images/trans1.png' class=''></span></span>";
                $("header").after(userSpan);

                // TODO - implement merge occurence
                //if (info.merged !== undefined && info.merged == 0){
                    //var warningHtml = '<div class="alert alert-danger mergeWarning"  role="alert"' + //data-toggle="popover" ' +
                        //'<span class="glyphicon glyphicon-warning-sign">   ' +
                        //'There is another account with your same credentials. <br />' +
                        //'<a href="#" onclick="mergeAccounts()" class="alert-link">Click here to merge</a> your account with these existing credentials?' +
                        //'</span></div>';
                    //$('#accordion').before(warningHtml);
                    //$('[data-toggle="popover"]').popover();
                //}

                // show skills
                this.showSkills();
            }else{
                $('.logout').toggle();
            }
        },
        /**
         * Show user rank
         * @method showSkills
         */
        showSkills: function(){
            user = this.getCookie('user');
            data = {};
            data.user_id = user.user_id;
            data.id = 'tr';
            data.function = 'TRU';
            $.ajax({
                desc: 'Get TrackRecord',
                data: data,
                type: "POST",
                url: app.engine
                })
                .done(function(data, textStatus, jqXHR){
                    data = data[0];
                    wins = data.wins;
                    losses = data.losses;
                    sumGames = wins + losses;
                    winPct = wins / sumGames;
                    winPct = (isNaN(winPct)) ? 0 : winPct;
                    rate_level = parseInt(Math.ceil(winPct * 10));
                    rate_class = 'star' + rate_level;
                    $('.skill_level img').removeClass().addClass(rate_class);
                    $('.skill_level_text').html(getLevelName(winPct * 100));
            });
        },
        /**
         * Sets cookies with info
         * @method setCookie
         * @param {string} name Cookie name
         * @param {object} data Cookie data
         */
        setCookie: function(name, data){
            $.cookie.json = true;
            $.removeCookie(name);

            // remove default theme and use user theme
            if (name == 'user') $.removeCookie('theme');

            $.cookie(name, data);
         },
         /**
          * Set jQuery UI theme by string
          * @method setTheme
          * @param {string} theme JQuery ui theme string
          */
         setTheme: function(theme){
            // if no theme sent set default
            var cook_theme;
            uObj = this.getCookie('user');
            if (typeof(uObj) !== "undefined") cook_theme = uObj.theme;

            if (theme === undefined){
                theme = (cook_theme === undefined) ? app.defaultTheme : cook_theme;
            }

            theme = theme.replace(/['"]+/g,'');
            // refresh cookie
            $.removeCookie("theme");
            $.cookie("theme", theme);

            cook_theme = $.cookie('theme');
            var theme_url = "https://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/themes/" + theme + "/jquery-ui.css";
            $('head').append('<link href="'+ theme_url +'" rel="Stylesheet" type="text/css" />');
        },
        /**
         * Gets cookies info
         * @method getCookie
         * @param {string} name Cookie name
         */
        getCookie: function(name){
            $.cookie.json = true;
            return $.cookie(name);
         },
        /**
         * Pretty print a javascript object
         * @method pprint
         */
         pprint: function(obj){
            return "<pre>" + JSON.stringify(obj, null, 2) + "</pre>";
         },
        /**
         * Gathers categories from db
         * @method getCategories
         */
         getCategories: function(){
            $.ajax({
                contentType: "application/x-www-form-urlencoded",
                function: 'utility',
                data: {'function' : 'GC'},
                type: "POST",
                url: app.engine
            })
            .done(function(result, status, jqXHR){
                if (typeof(result) === 'string'){
                    isHTML = /<(?=.*? .*?\/ ?>|br|hr|input|!--|wbr)[a-z]+.*?>|<([a-z]+).*?<\/\1>/i.test(result);
                    if (isHTML){
                        app.dMessage('Error', jqXHR.getAllResponseHeaders());
                    }else{
                        result = JSON.parse(result)[0];
                    }
                }
                // internal error handling
                if (result.error !== undefined){
                    console.log(result.error);
                    return result;
                }else{
                    app.objCategories = result.categories;
                    app.loadCategories(app.objCategories);
                }
            })
            .fail(function(jqXHR, textStatus, errorThrown) {
                app.dMessage(textStatus + ': request failed! ', errorThrown);
                console.log(textStatus + ': request failed! ' + errorThrown);
            });
        },

         /**
         * Loads categories into appropriate selectmenus
         * @method loadCategories
         * @param  {object} categories object containing all category data
         * @return none
         */
        loadCategories: function(objCategories){
            if (objCategories === undefined) {
                getCategories();
                return false;
            }
            // get all "Category" select menus
            menus = $('select[id$=Category]').not('[id*=Sub]').not('[id*=temp]');
            $.each(menus, function(){
                $(this)
                    .empty()
                    .append(new Option("None", ""));
                element = $(this);
                $.each(objCategories, function(idx, objCat){
                    parentID = objCat.parent_id;
                    cat = objCat.category;
                    id = objCat.category_id;
                    if (element.hasClass('allCategories')){
                        // do not filter categories
                        element.append(new Option(cat, id));
                    }else{
                        // get top level categories
                        if (parentID === 0){
                            element.append(new Option(cat, id));
                        }
                    }
                });
                $(this).selectmenu().selectmenu("refresh", true);
            });
        },
        /**
         * @method getCatQuestions
         * @param {int} catID Category ID
         * @param {int} elementID Category ID
         */
        getCatQuestions: function(catID, elementID){
            app = this;
            if (catID === "") return false;
            qList = $(elementID);
            data = {'function' : 'GQ'};
            data.category_id = catID;
            $.ajax({
                contentType: "application/x-www-form-urlencoded",
                function: 'utility',
                data: data,
                type: "POST",
                url: app.engine
            })
            .done(function(result){
                if (typeof(result) !== 'object'){
                    app.dMessage('Error Getting Category Questions', result);
                    return result;
                }
                // internal error handling
                if (result.error !== undefined){
                    app.dMessage(result.error.error, result.error.msg);
                    console.log(result.error);
                    return result;
                }
                // load question selectmenu
                $.each(result.questions, function(){
                    qList.append($('<option />').val(this.question_id).text(this.question_text));
                    qList.val("");
                    qList.selectmenu('refresh');
                });
            });
        },
        /**
         * Function is a helper function not to be called directly
         * returns default messagebox properties
         * It sets a default icon, "ok" button
         * @method get_mboxDefaults
         * @param {string} title Title of the messagebox
         * @param {string} message Messagebox message
         * @returns {object} Messagebox defaults
         */
        get_mboxDefaults: function(title, message){
            return {
                autoResize: true,
                dialogClass: 'no-close',
                modal: true,
                title: title,
                open: function(){
                    icon = '<span class="ui-icon ui-icon-info" style="float:left; margin:0 7px 5px 0;"></span>';
                    $(this).parent().find("span.ui-dialog-title").prepend(icon);
                    $(this).html(message);
                },
               buttons: {
                    Ok: function () {
                       $(this).dialog("close");
                    }
               }
           };
        },
       /* handles toggle between login and reset password panels */
       toggleSignIn: function(){ $("#login-tab, #reset-tab").toggle(); },
        /**
         * Shows the login dialog box
         * @method showLoginDialog
         * @param {number} idx index of the tab to display
         * - 0: Login tab
         * - 1: Signup tab
         */
         showLoginDialog: function(idx){
            // get logic for signup and login
            require(['pages/index','pages/signup']);
            if (!$('.modal-container').length) app.createLoginDialog();
            // set up Facebook login button
            app.showFBButton()

            $('.modal-container')
                .tabs({ active: idx })
                .dialog('open')
                .siblings('div.ui-dialog-titlebar').remove();
        },
        dMessage : function(title, message, options){
            // enable default title
            if (title && message === undefined){
                message = title;
                title = "Error";
            }

            if (message !== undefined){
                // print objects in readable form
                message = (typeof(message) === 'object') ? this.pprint(message) : message;
            }else{
                message = "";
            }
            settings = this.get_mboxDefaults(title, message);
            if (options) settings = $.extend({}, this.get_mboxDefaults(title, message), options);
            $('<div />').dialog(settings);
        },
        /** @property {function} getTheme Get current theme */
        getTheme: function(){
            $.cookie.json = true;
            current_theme =  $.cookie('theme');
            return (current_theme === undefined) ? this.defaultTheme : current_theme;
        },
        /** @property {function} subCheck Handles sub-category selectmenu generation */
        subCheck:function(element){
            app = this;
            if (element === undefined) return false;

            // get calling element info
            current_id = parseInt(element.val());
            current_selection = $("option:selected", element).text();
            element_id_prefix = element.attr('id').prefix();
            element_is_top = false;

            // quit if None selected
            if (isNaN(current_id)) return false;

            // check the categories object for subcategories of current selection
            catCollection = [];
            $.each(app.objCategories, function(idx, objCat){
                parentID = objCat.parent_id;
                catID = objCat.category_id;

                if (current_id == catID && parentID === undefined ){ element_is_top = true; }
                // accumulate children
                if (parentID == current_id){
                    catCollection.push(objCat);
                }
            });

            if (catCollection.length > 0){
                // create subcategory select, fill and new subs checkbox
                // get the template paragraph element
                $('#placeHolder').load('templates.html #subCatTemplate', function(response, status, xhr){
                    if (status != 'error'){
                        parentP = $('#subCatTemplate');
                        // clone it
                        var clone = parentP.children().clone();

                        // add identifying class for later removal
                        clone.addClass('clone');

                        // get current iteration of instantiation of the template for naming
                        var iteration = $(document).data('tempCount');
                        // increment iteration as index and save new iteration
                        index = ++iteration;
                        $(document).data('tempCount', iteration);

                        // loop through all child elements to modify before appending to the dom
                        clone.children().each(function(){
                            changeID = true;
                            elName = null;
                            elID = null;
                            // get the id ov the current element
                            var templateID = $(this).prop('id');
                            // make sure there are no blank ids
                            switch ($(this).prop('type') || $(this).prop('nodeName').toLowerCase()){
                                case 'label':
                                    strFor = $(this).prop('for');
                                    origPrefix = strFor.prefix();
                                    strFor = strFor.replace(origPrefix, element_id_prefix) + index;
                                    // change 'for' property for label
                                    $(this).prop('for', strFor);
                                    changeID = false;
                                    break;
                                case 'select':
                                case 'select-one':
                                    elID = templateID.replace(templateID.prefix(), element_id_prefix) + "[" + index + "]";
                                    elName = templateID.replace(templateID.prefix(), element_id_prefix) + "[]";
                                    // add new option to select menu based on parent id
                                    $(this)
                                        .addClass('required')
                                        .empty()
                                        .append(new Option("None", ""));
                                        tmpSelect = $(this);
                                        $.each(catCollection, function(idx, objCat){
                                            cat = objCat.category;
                                            id = objCat.category_id;
                                            tmpSelect.append(new Option(cat, id));
                                        });
                                        break;
                                case 'checkbox':
                                    elID = templateID.replace(templateID.prefix(), element_id_prefix) + index;
                                    elName = elID;
                                    break;
                                default:
                                    changeID = false;
                            }
                            // only change the id of necessary elements
                            if (changeID)  {
                                $(this).prop({"id":elID, "name": elName });
                            }
                        });
                        element.parent().after(clone);
                        $('#placeHolder').empty();
                    }else{
                        app.dMessage(status.capitlize() + ' - Template File', xhr.statusText);
                    }
                });
            }else{
                // category is top-level
                msg = "No Sub-category found for: " + current_selection;
                title = "Selection Error: " + current_selection;
                msg += (element_is_top) ? " is a top-level category!" : " has no sub-categories";
                app.dMessage(title, msg);
            }
        },
        /**
         * displays the appropriate image for FB (login/logout)
         * @method showFBButton
         */
        showFBButton: function(){
            FB.getLoginStatus(function(response){
                prefix = "assets/css/images/"
                src = response.status === "connected" ? "fbLogOUT.png" : "fbLogIN.png";
                $("#fbButtonImage").prop("src", prefix + src)
                fbImage();
            });
        },

        /**
         * create login dialog from template
         * @method createLoginDialog
         */
        createLoginDialog: function(){
            //load the signin/up template
            $('.test').load('templates.html .modal-container', function(response, status, xhr){
                if (status != 'error'){

                    // set up Facebook login button
                    app.showFBButton()

                    // hide password reset panel by default
                    $("#reset-tab").toggle();
                    $(".modal-container")
                        .tabs({
                            beforeActivate: function(event, ui){
                                // if going from reset password to signup...
                                if (ui.newPanel[0].id === 'signup-tab'){
                                    // reset signup tab to prevent...weirdness
                                    if ($('#reset-tab').is(':visible')) app.toggleSignIn();
                                }
                            }
                        })
                        .dialog({
                            // resizable: false,
                            autoResize: true,
                            autoOpen: false,
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
                    $('.cd-form-bottom-message').click(app.toggleSignIn);
                    app.showLoginDialog();
                }else{
                    app.dMessageBox('Error', xhr);
                }
            });
        },
        getCookieByName: function(name){
            var re = new RegExp(name + "=([^;]+)");
            var value = re.exec(document.cookie);
            return (value != null) ? unescape(value[1]) : null;
        }
    };

    return app;
});
