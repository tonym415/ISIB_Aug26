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
 * @module app
 * @return {Object} object with specific initialization and data handling for ISIB
 */
define([
    'jquery',
    'appLib',
    'cookie',
    'blockUI',
    'jqueryUI',
    'validate',
    'tooltipster'], function($, lib){
    var app,
        objCategories = {},
        testBtnDialog,
        defaultTheme = 'ui-lightness',
        app_engine = "cgi-bin/engine.py",
        default_avatar = 'assets/css/images/anon_user.png',
        selectMenuOpt = { width: '65%'},
        tabOptions = {
            active: false,
            collapsible: true,
            heightStyle: 'content',
            hide: { effect: "explode", duration: 1000 },
            show: { effect: "slide", duration: 800 }
        };

    /**
     * @method init
     * @desc Initialization function for all pages
     * @param  {string} page code name for current pages
     * @return {boolean} If true show the login window
     */
    var init = function(page){
        var returnValue,
            showLogin = false;
        // if not logged in send to login page
        user = this.getCookie('user');
        this.currentPage = page;

        // ensure player is logged in
        showLogin = this.ensureLogin(page, user);

        //  Initalize app setup functions
        this.setTheme();
        this.navBar(page);

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
        $("input[type=submit]").button();
        $("input[type=button]").button();

        // final page setup
        // add event listener for logout
        this.logout();
        this.setFooter();
        this.rankInfo();
        // initialize agreement module
        this.agreement();
        return returnValue;
    };

    /**
     * @method ensureLogin
     * @desc Use window location information to determine if login flag is needed
     */
    function ensureLogin(page, user){
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
    }


    /**
     * @method setFooter
     * @desc Universal function to create the footer
     * Uses template string from library to load footer {@link module:app/appLib~getFooterText}
     */
    function setFooter(){
        // NOTE: ids/classes are important progmatically (caution when changing)
        // wrap the content of the body with a container and wrap that with container to accomodate the footer stylings
        $('body').wrapInner("<div id='content'></div>");
        $('#content').wrap('<div id="container" />');
        $('<div class="footer"> </div>')
            .addClass('ui-state-default')
            .html(lib.getFooterText())
            .prepend( $('<div class="test" />') )
            .insertAfter('#container');
    }

    /**
     *   * Shows test buttons for the current page if any
     *
    */
    function toggleTestButtons(){
        btnContainer = $('#btnTest');

        if (btnContainer.length > 0){
            // create test button dialog
              if (testBtnDialog === undefined){
                  btnContainer.toggleClass('no-display');
                  $('.test').html("TEST TOGGLE");
                  testBtnDialog = btnContainer.dialog({
                      title: "Test Buttons",
                      dialogClass: 'no-close',
                      height: 200,
                      width: 800,
                      modal: true,
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
        }
    }

    /**
     * @method agreement
     * @desc Shows agreement window
     */
    function agreement(){
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
    }

    /**
     * @method showRanking
     * @desc Build rankings element
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
     * @method rankInfo
     * @desc Display rank info
     */
    function rankInfo(){
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
    }

    /**
     * @method getAvatar
     * @param {string} avFilespec Name of file
     * @returns {string} Fully file specification of avatar
     */
    function getAvatar(avFilespec){
        if (avFilespec === undefined){
            info = getCookie('user');
            return (info.avatar) ? '/assets/avatars/' + info.avatar : default_avatar;
        }else{
            return (avFilespec !== "") ? '/assets/avatars/' + avFilespec : default_avatar;
        }
    }

    /**
     * @method logout
     * @desc Logout
     */
    function logout(){
        app = this;
        $('.logout').on('click', function(e){
            e.preventDefault();
            $.removeCookie('user');
            window.location.assign(app.pages.home);
        });
    }

    /**
     * @method loginNavBar
     * @param {string} page Page key from library
     * @desc Uses parameter to appropriately set the navigation bar
     * See {@link module:app/appLib~navPages} for param (page) reference
     */
    var loginNavBar = function(page){
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
            // if (page === 'home') return false;
            userSpan = "<span id='welcome' class='ui-widget'>Welcome, <a href='" +  lib.navPages.profile + "'>   "  + info.username  ;
            userSpan += "<img src='" + getAvatar() + "' title='Edit " + info.username + "' class='avatar_icon'></a>";
            userSpan += "<br /><span class='skill_level ui-widget'><span class='skill_level_text rankInfo'>Level</span>:<img src='/assets/css/images/trans1.png' class=''></span></span>";
            $("header").after(userSpan);

            // show skills
            this.showSkills();
        }else{
            $('.logout').toggle();
        }
    };

    /**
     * @method showSkills
     * @desc Show user rank
     */
    var showSkills = function(){
        user = this.getCookie('user');
        data = {};
        data.user_id = user.user_id;
        data.id = 'tr';
        data.function = 'TRU';
        $.ajax({
            desc: 'Get TrackRecord',
            data: data,
            type: "POST",
            url: app_engine
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
    };

    /**
     * @method getLevelName
     * @param {number} val
     * @desc Base on this param, this function returns the correct skill level title using the [skillLevel object]{@link module:app/appLib~skillLevels}
     */
    function getLevelName(val){
        // get the index of the skill level name
        idx = val % 100 / 10 | 0;
        return lib.skillLevels[idx].title;
    }

    /**
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
     * @method unloading
     * @desc Unblock the ui
     */
    var unloading = function(element){
        var data = $(window).data();

        if (data['blockUI.isBlocked'] == 1) {
            $('#content').unblock();
        }
        $.unblockUI();
    };

    /**
     * @desc Adds loading message to all ajax calls by default
     */
    $(document)
        .ajaxStart(function(event, xhr, options) {
            loading();
        })
        .ajaxComplete(function(event, xhr, options) {
            // if options.function == logger or utility...don't log
            if (options.function === undefined){
                // if (options.desc === undefined) return false;
                user = getCookie("user");
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
                    url: app_engine
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
        .ajaxError(function(event, xhr, options) {
            unloading();
        });

    /**
     * sets cookies with info
     * @method setCookie
     * @param {string} name Cookie name
     * @param {object} data Cookie data
     */
     function setCookie(name, data){
        $.cookie.json = true;
        $.removeCookie(name);

        // remove default theme and use user theme
        if (name == 'user') $.removeCookie('theme');

        $.cookie(name, data);
     }

     /**
      * @method setTheme
      * @param {string} theme JQuery ui theme string
      */
     function setTheme(theme){
        // if no theme sent set default
        var cook_theme;
        uObj = getCookie('user');
        if (typeof(uObj) !== "undefined") cook_theme = uObj.theme;

        if (theme === undefined){
            theme = (cook_theme === undefined) ? defaultTheme : cook_theme;
        }

        theme = theme.replace(/['"]+/g,'');
        // refresh cookie
        $.removeCookie("theme");
        $.cookie("theme", theme);

        cook_theme = $.cookie('theme');
        var theme_url = "http://ajax.googleapis.com/ajax/libs/jqueryui/1.8.6/themes/" + theme + "/jquery-ui.css";
        $('head').append('<link href="'+ theme_url +'" rel="Stylesheet" type="text/css" />');
    }

    /**
     * gets cookies info
     * @method getCookie
     * @param {string} name Cookie name
     */
     function getCookie(name){
        $.cookie.json = true;
        return $.cookie(name);
     }

     function pprint(obj){
        return "<pre>" + JSON.stringify(obj, null, 2) + "</pre>";
     }

    /**
     * Determines of an object is empty
     * @return {Boolean} [description]
     */
    function isEmpty(obj){
        length = Object.getOwnPropertyNames(obj).length;
        return  length > 0 ? false : true;
     }
    var getCategories = function(){
        app = this;
        $.ajax({
            contentType: "application/x-www-form-urlencoded",
            function: 'utility',
            data: {'function' : 'GC'},
            type: "POST",
            url: app_engine
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
                loadCategories(app.objCategories);
            }
        })
        .fail(function(jqXHR, textStatus, errorThrown) {
            app.dMessage(textStatus + ': request failed! ', errorThrown);
            console.log(textStatus + ': request failed! ' + errorThrown);
        });
    };

     /**
     * loads categories into appropriate selectmenu
     * @param  {object} categories object containing all category data
     * @return none
     */
    var loadCategories = function(objCategories){
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

    };


    /**
     * @method getCatQuestions
     * @param {int} catID Category ID
     * @param {int} elementID Category ID
     *
     */
    var getCatQuestions = function(catID, elementID){
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
            url: app_engine
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
    };

    function escapeId(myID){
        return "#" + myID.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\\\$&");
    }


    // validator selectmenu method
    $.validator.addMethod("selectNotEqual", function(value, element, param) {
        return param != value;
    },"Please choose a subcategory");

    // validator defaults
    $.validator.setDefaults({
        debug: true,
        ignore: "",
        errorPlacement: function (error, element) {
            // account for jquery selectmenu
            id = escapeId(element.context.id);
            /*  I was lazy and copied the forms so ids are duplicated
                The next if is to specify the element by form
            */
            if (id.indexOf('[') < 0){
                // the previous test is for dynamic subcategory elements (eg. "#p_subCategory\\[2\\]")
                currentForm = "#" + $(element).closest('form')[0].id;
                currentId = currentForm + " " + id;
                element = $(currentId);
            }
            if (element[0].nodeName === "SELECT"){
                // account for jquery selectmenu structure which
                // uses a span to display list/button
                // next() refers to '#' + element.id + '-button'
                element = element.next();
            }
            // last chance to init element if not done already
            if ($(element).data('tooltipster-ns') === undefined) $(element).tooltipster();

            var lastError = $(element).data('lastError'), // get the last message if one exists
                newError = $(error).text();               // set the current message

            $(element).data('lastError', newError);  // set "lastError" to the current message for the next time 'errorPlacement' is called

            if(newError !== '' && newError !== lastError){  // make sure the message is not blank and not equal to the last message before allowing the Tooltip to update itself
                $(element)
                    .tooltipster('content', newError) // insert content into tooltip
                    .tooltipster('show');              // show the tooltip
            }
        },
        success: function (label, element) {
            if (element.nodeName === "SELECT"){
                // account for jquery selectmenu structure which
                // uses a span to display list/button
                // next() refers to '#' + element.id + '-button'
                element = $(element).next();
            }
            // last chance to init element if not done already
            if ($(element).data('tooltipster-ns') === undefined) $(element).tooltipster();
            $(element).tooltipster('hide');  // hide tooltip when field passes validation
        },
        showErrors: function (errorMap, errorList) {
              if (typeof errorList[0] != "undefined") {
                  var position = $(errorList[0].element).position().top;
                  $('html, body').animate({
                      scrollTop: position
                  }, 300);

              }
              this.defaultShowErrors();
          }
    });

    function get_mboxDefaults(title, message){
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
    }

    // usersnap code for bug reporting
    (function() {
        var s = document.createElement("script");
        s.type = "text/javascript";
        s.async = true;
        s.src = '//api.usersnap.com/load/'+
                '1135d21c-f848-4993-a9cb-fe7141f4cac2.js';
        var x = document.getElementsByTagName('script')[0];
        x.parentNode.insertBefore(s, x);
    })();

    function toggleSignIn(){ $("#login-tab, #reset-tab").toggle(); }

    function showLoginDialog(idx, fn){
        // get logic for signup and login
        require(['pages/index','pages/signup']);
        if (!$('.modal-container').length) createLoginDialog();
        $('.modal-container')
            .tabs({ active: idx })
            .dialog('open')
            .siblings('div.ui-dialog-titlebar').remove();
    }

    /**
     * Returns the app object with var/functions built in
    * @alias module:app
    */
    app = {
        /** @property  {string} defaultTheme Default theme */
        defaultTheme: defaultTheme,
        /** @property {object} selectMenuOpt Default select menu options */
        selectMenuOpt: selectMenuOpt,
        /** @property {object} tabOptions Default tab options */
        tabOptions: tabOptions,
        /** @property {object} pages Site pages from library so no hard coding is necessary */
        pages: lib.navPages,
        /** @property {string}  engine CGI script = site traffic cop for database interaction */
        engine : app_engine,
        /** @property {object}  objCategories global object used to populate category selectmenu */
        objCategories: objCategories,
        // utility functions
        /** @property {function} init Initialization of all pages */
        init: init,
        /** @property {function} mboxDefaults gets message box default options (params: title, message) */
        mboxDefaults: get_mboxDefaults,
        /** @property {function} isEmpty Test if object is empty*/
        isEmpty: isEmpty,
        /** @property {function} setCookie */
        setCookie: setCookie,
        /** @property {function} getCookie */
        getCookie: getCookie,
        /** @property {function} showSkills */
        showSkills: showSkills,
        /** @property {function} showLoading Handles wait message for ajax calls */
        showLoading: loading,
        /** @property {function} navBar Handles navigation bar and welcome info */
        navBar: loginNavBar,
        /** @property {function} hideLoading Handles closing wait message for ajax calls */
        hideLoading: unloading,
        /** @property {function} setTheme */
        setTheme: setTheme,
        /** @property {function} prettyPrint Formatting for js objects */
        prettyPrint: pprint,
        /** @property {function} logout */
        logout: logout,
        /** @property {function} getCategories */
        getCategories: getCategories,
        /** @property {function} loadCategories */
        loadCategories: loadCategories,
        /** @property {function} getCatQuestions */
        getCatQuestions: getCatQuestions,
        /** @property {function} getAvatar */
        getAvatar: getAvatar,
        /** @property {function} agreement  Functions for terms and conditions */
        agreement: agreement,
        /** @property {function} setFooter */
        setFooter: setFooter,
        /** @property {function} rankInfo  Functions for displaying rank info */
        rankInfo: rankInfo,
        /** @property {function} toggleTestButtons  */
        toggleTestButtons: toggleTestButtons,
        /** @property {function} ensureLogin  */
        ensureLogin: ensureLogin,
        /** @property {function} showLoginDialog  */
        showLoginDialog: showLoginDialog,
        /** @property {function} toggleSignIn  */
        toggleSignIn: toggleSignIn,
        /** @property {function} dMessage Generate app messages  */
        dMessage : function(title, message, options){
            title = (title === undefined) ? "Error" : title;
            if (message !== undefined){
                // print objects in readable form
                message = (typeof(message) === 'object') ? this.prettyPrint(message) : message;
            }else{
                message = "";
            }
            settings = this.mboxDefaults(title, message);
            if (options) settings = $.extend({}, this.mboxDefaults(title, message), options);
            $('<div />').dialog(settings);
        },
        /** @property {function} getTheme Get current theme*/
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
                /* create subcategory select, fill and new subs checkbox */
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
        }
    };


    function createLoginDialog(){
        //load the signin/up template
        $('.test').load('templates.html .modal-container', function(response, status, xhr){
            if (status != 'error'){
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
    }

    /**
     * @memberof app
     * @event Navigation click
     * @desc Handles click event for Signup/SignIn buttons
     * and determins whether to create login dialog and which tab to open
     */
    $(document).on('click', '.main-nav',function(event){
        user = app.getCookie('user');
        signup = $(event.target).is('.cd-signup');
        if (signup) app.agreement();

        signin = $(event.target).is('.cd-signin');
        // function helper to show signin panel
        if (signup || signin){
            index = (signup) ? 1 : 0;
            // if the signup element has not been created
            if (!$('.modal-container').length){
                createLoginDialog();
            }else{
                app.showLoginDialog(index);
            }
        }
    });
    return app;
});
