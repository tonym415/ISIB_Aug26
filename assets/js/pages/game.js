/**
* @fileOverview   Handles all functions for the game page
* @module game
* @author Tony Moses
* @version 0.1
*
 */
require([
    'jquery',
    'app',
    'gameLib',
    'flipclock',
    'validate',
    'jqueryUI',
    'livequery',
    'cookie',
    'html2canvas',
    'blockUI'
], function($, app, lib){
    // game parameters global var
    var user,
    timeout,
    gameParameters,
    timeLeft = 0,
    divVotePrefix = 'comment_',
    onStateClass = "ui-state-highlight",
    offStateClass = "ui-widget-content",
    disableStateClass = "ui-state-disabled",
    gamePanel = 'h3:contains("Debate Game")',
    paramPanel = 'h3:contains("Parameter Selection")',
    resultPanel = 'h3:contains("Game Results")',
    gameSubmitted = false,
    pollCounter = 0;

    // handle page setup upon arrival
    app.init('game');
    user = app.getCookie('user');

       $(document).on('click', '.test', function(){
        app.toggleTestButtons();
    });


    /**
     * function loads meta data (eg. time options/wager options
     * @method loadMeta
     */
    (function loadMeta(){
        $.ajax({
            data: {'function': "GMD", 'id': 'getMetaData'},
            url: app.engine,
            type: 'POST',
            dataType: 'json',
            desc: 'utility (load metadata)',
            success: function(data){
            $.each($('[id=wager]'), function(){
                $(this)
                    .empty()
                    .append(new Option("None", ""));

                // load question selectmenu
                element = $(this);
                $.each(data.wagers, function(){
                $(element)
                    .append($('<option />')
                    .val(this.credit_id)
                    .text(this.credit_value + ' credit(s)'))
                    .val("")
                    .selectmenu('refresh');
                    });
                });

                $.each($('[id=timeLimit]'), function(){
                    $(this)
                        .empty()
                        .append(new Option("None", ""));

                    element = $(this);
                    // load question selectmenu
                    $.each(data.times, function(){
                        $(element)
                            .append($('<option />')
                            .val(this.time_id)
                            .text(this.time_in_seconds.toString().toMMSS()))
                            .val("")
                            .selectmenu('refresh');
                    });
                });
            }
        });
    })();

    /**
     *  Recursive poller of the db to get players and start game
     *  - on success: loads the debate
     *  - on error: gives the user another chance to search for a game
     * @method getGame
     */
    function getGame(){
        // create ajax poll
        game = function(){
            $.ajax({
                data: gameParameters,
                url: app.engine,
                type: 'POST',
                dataType: 'json',
                desc: 'Game Creation',
                global: false,
                success: function(data){
                    if (pollCounter <= 4){
                        pollCounter++;
                        gameParameters.counter = pollCounter;
                        if (data.status === 'pending'){
                            getGame();
                        }else if(data.status === 'complete'){
                            // update game ui
                            clearTimeout(timeout);
                            loadDebate(data);
                        }else if(data.queue){
                            // set the created queue_id to gameParameters
                            gameParameters.queue_id = data.queue.queue_id;
                            matchText = 'Please stay with us while Isaiditbest finds you the best match up...';
                            $('#cancelSearch h1').html(matchText);
                            getGame();
                        }
                    }else{
                        $('#game_panel').unblock();
                        clearTimeout(timeout);
                        pollCounter = 0;
                        app.dMessage(
                            "Alert",
                            '<h2>Game Not Found</h2><p>Retry?</p>',
                            {
                                buttons: {
                                    Yes: function(){
                                        $('#game_panel').block({
                                            message: $('#cancelSearch'),
                                            css:{ width: '275px'}
                                        });
                                        getGame();
                                        $(this).dialog('close');
                                    },
                                    No: function(){
                                        cancelGame();
                                        // enable/disable appropriate panels
                                        toggleParams();
                                        // go back to parameters
                                        openAccordionPanel('last');
                                        $(this).dialog('close');
                                    }
                                }
                            }
                        );
                    }
                }
            });
        };
        // if this is the first time called immediately excute ajax
        if (gameParameters.counter === 0){
            $('#cancelSearch h1').html('Submitting your parameters...');

            // enable/disable appropriate panels
            toggleParams();

            openAccordionPanel('next');
            $('#game_panel').block({
                message: $('#cancelSearch'),
                css:{ width: '275px'}
            });
            game();
        } else {
            // if polling
            timeout = setTimeout(game, 5000);
        }
    }


    /**
    * Anonymous closure to set up all parameter forms for validation
    * @method <anonymous>
    */
    (function(){
        // retrieve a param forms
        forms = $('div.paramDiv').children('form');
        // for each form
        $.each(forms, function(){
            // add validation w/ handler
            $(this).validate({
                submitHandler: function(){
                    gameParameters = $(this.currentForm).serializeForm();
                    gameParameters.user_id = user.user_id;
                    gameParameters.function = 'GG';
                    gameParameters.counter = pollCounter;
                    getGame();
                }
            });
            // for each of the selects in the form
            elSelects = $(this).find('select');
            // add rule
            $.each(elSelects, function(){
                $(this).rules("add", {
                    required: true,
                    selectNotEqual: ""
                });
            });
        });
    })();

    /**
     * HTML element containing game
     * @namespace gameUI
    */
    $('#gameUI')
        /**
         * validate game entry form "gameUI"
         * @namespace validator
         * @memberof module:game~gameUI
         */
        .validate({
            /**
             * Callback for submission of game
             * Gathers form data, adds user_id and stops the
             * game clock
             * @todo use the time left on the game clock to determine wait time
             * @method
             * @memberof module:game~gameUI.validator
             * @type {$.fn.validate}
             * @param {element} form implied param
             */
            submitHandler: function(){
                data = $(this.currentForm).serializeForm();
                data.user_id = user.user_id;
                submitGame(data);
                // get the time left on the clock to know
                // how long to wait for other users
                timeLeft = gameClock.getTime().time;
                gameClock.stop();
            }
    });

    /**
     * Submits game data via AJAX
     * @method submitGame
     * @param {object} form data and current user id
     */
    function submitGame(data){
        gameSubmitted = true;
        data.function = 'SUG';
        // app.dMessage('Submitting Game', data);
        $.ajax({
            url: app.engine,
            data: data,
            type: 'POST',
            dataType: 'json',
            desc: 'Game Submission',
            success: function(result){
                if (!result.error){
                    // reset counter for other uses
                    pollCounter = 0;
                    // start polling for comment data
                    commentPoll();
                }else{
                    app.dMessage(result.error, result.stm);
                }
            }
        });
    }

    /**
     * @method getCommentPollData
     * @returns {object} object object containing function name, id, game id, counter
     */
    function getCommentPollData(){
        return {
            "function" : "GCG", // Get      Comments from Game
            'id' : 'commentPoll',
            'game_id' : $('#game_id').val(),
            'counter' : pollCounter
        };
    }

    /**
     * Calls polling function with generated options
     * @method commentPoll
     */
    function commentPoll(){
        opts = {
            getData: getCommentPollData,
            desc: 'Comment Polling',
            strPending: 'Waiting on comments from {0} players ...',
            completeFunc: displayComments,
            strInitial: 'Gathering player comments...'
        };
        poller(opts);
    }

    /**
     * Polling function
     * @method poller
     */
    function poller(options){
        data = options.getData();
        // create ajax poll
        ajaxCall = function(){
            $.ajax({
                data: data,
                url: app.engine,
                type: 'POST',
                dataType: 'json',
                desc: options.desc,
                global: false,
                success: function(results){
                    if (pollCounter <= 400){
                        pollCounter++;
                        data.counter = pollCounter;
                        if (!results.status){ app.dMessage(data.error, data.stm);}
                        if (results.status === 'pending'){
                            // update ui continue polling
                            $('#game_panel').unblock();
                            msg = $.validator.format(options.strPending, [results.pending]);
                            $('#game_panel').block({message: msg, css:{ width: '275px'}});
                            poller(options);
                        }else if(results.status === 'complete'){
                            // update game ui
                            clearTimeout(timeout);
                            options.completeFunc(results.users);
                            $('#game_panel').unblock();
                        }
                    }else{
                        $('#game_panel').unblock();
                        pollCounter = 0;
                        app.dMessage('Data', data);
                    }
                }
            });
        };
        // if this is the first time called immediately excute ajax
        if (data.counter === 0){
            $('#game_panel').block({message: options.strInitial, css:{ width: '275px'}});
            ajaxCall();
        } else {
            // if polling
            timeout = setTimeout(ajaxCall, 5000);
        }
    }

    /**
     * Displays game comments in jquery selectable format
     * @method displayComments
     * @param {array} users an array
     */
    function displayComments(users){
        // show vote/hide game
        toggleGame();

        // build vote form
        // add a ul before the vote button
        $('#btnVote').before('<ul id="selectable" >');
        // for each of the users in the data...
        $.each(users, function(){
            $('#debateVote ul').append(
                // add user formatted info
                $('<li />')
                .append(
                    $('<div id="' + divVotePrefix + this.user_id + '" />').append(
                        $('<img class="avatar" src=' + app.getAvatar(this.avatar) + " />"),
                        $('<div />')
                        .addClass('votequote')
                        .text(this.thoughts),
                        $('<cite />').text(this.username)
                    )
                )
                .addClass(offStateClass)
                .addClass('selectable')
            );
        });

        $('#selectable')
            .selectable({
            filter:'li.selectable',
            selected: function(event, ui){
                // deselect selection if selected previously
                if ($.inArray(onStateClass, ui.selected.classList) > -1){
                    $(ui.selected).addClass(offStateClass).removeClass(onStateClass);
                }else{
                    $( ".ui-selected", this ).each(function() {
                        // current user cannot vote for themselves
                        selectedId = $(this).children().prop('id').substring(divVotePrefix.length);
                        if (parseInt(selectedId) === user.user_id){
                            app.dMessage("Illegal Action", "You cannot vote for yourself!");
                        }else{
                            $(this).removeClass(offStateClass).addClass(onStateClass);
                        }
                    });
                }
                $('li.selectable').not(".ui-selected").not(disableStateClass).each(function() {
                    $(this).removeClass(onStateClass).addClass(offStateClass);
                });
            }
        });

        // disable current user comment from selection
        $('#' + divVotePrefix + user.user_id).parent()
        .removeClass(offStateClass)
        .addClass(disableStateClass);
    }

    /**
     * HTML element containing vote panel
       @namespace debateVote
     */
    $('#debateVote')
        /**
         * Validation for voting form "debateVote"
         * @namespace validator
         * @memberof module:game~debateVote
         */
        .validate({
            /**
             * Callback method for vote submission
             * @method
             * @type {$.fn.validate}
             * @memberof module:game~debateVote.validator
             * @param {element} form implied param
             */
            submitHandler: function(){
            selectedComment = $('#selectable').find('li').hasClass(onStateClass);
            if (selectedComment){
                selectedComment =  $('#selectable').find('li.ui-state-highlight');
                idText = selectedComment.children().prop('id');
                vote_id = parseInt(idText.substring(divVotePrefix.length));
            }else{
                app.dMessage("Error", "You must select a comment.");
                return false;
            }
            //gather data
            data = $(this.currentForm).serializeForm();
            data.game_id = $('#game_id').val();
            data.function = 'SVG';
            data.counter = pollCounter = 0;
            data.user_id = user.user_id;
            data.vote_id = vote_id;
            submitVote(data);
        }
    });

    /**
     * Submit Vote to database and start polling for winner data
     * @method submitVote
     * @param {object} data Form data including vote and current user id
     */
    function submitVote(data){
        $.ajax({
            url: app.engine,
            data: data,
            type: 'POST',
            dataType: 'json',
            desc: 'Vote Submission',
            success: function(result){
                if (!result.error){
                    // reset counter for other uses
                    pollCounter = 0;
                    votePoll();
                }else{
                    app.dMessage(result.error, result.stm);
                }
            }
        });
    }

    /**
     * @method getVotePollData
     * @returns {object} object object containing function name, id, game id, counter
     */
    function getVotePollData(){
        return {
            "function" : "GVG", // Get      votes from Game
            'id' : 'votePoll',
            'game_id' : $('#game_id').val(),
            'counter' : pollCounter
        };
    }
    /**
     * Calls polling function with generated options
     * @method votePoll
     */
    function votePoll(){
        opts = {
            getData: getVotePollData,
            desc: 'Vote Polling',
            strPending: 'Waiting on votes from {0} players ...',
            completeFunc: loadWinner,
            strInitial: 'Gathering player votes...'
        };
        poller(opts);
    }

    /**
     * @method loadWinner
     * @param {array} users Array of objects represent vote data including user info
     * @returns {html} winnerDiv info
     */
    function loadWinner(users){
        // disable game, enable parameter selection
        toggleParams();

        // show results
        if (!$(resultPanel).is(':visible')){
            $(resultPanel).toggle();
        }

        // build winner info
        var obj = lib.getWinner(users);
        strWinnerVote ='<p><b>{0}</b>, with <i>{1}</i> votes, won {2} {3}</div></p>';
        strVote ='<span><b>{0}</b>, with <i>{1}</i> votes</span>';

        // display winner info
        $(resultPanel).click();
        // clear existing data
        var titleData = [
            obj.winner.username,
            obj.winner.votes,
            obj.pot,
            "dollar".pluralize(obj.pot)
        ];
        $('.winnerInfo')
            .empty()
            .load('templates.html .winnerDiv',function(){
                 $(".winnerTitle img").prop('src', '/assets/avatars/' + obj.winner.avatar);
                 $(".winnerTitle p").html($.validator.format(strWinnerVote, titleData));
            });

        resTitle = (obj.winner.user_id == user.user_id) ? "Congratulations!!! You won!" : "Maybe next time";
        $('#results_footer')
            .prepend(
              $('<h2>')
                .text("")
                .text(resTitle)
           );

        $('#results_footer a').prop('href', app.pages.game)
    }

    /* Handle Facebook sharing */

    /**
     * Add event for fb sharing
     * @event game#fb_share
     */
    $(".fbShareBtn").on('click', shareGameResult);

    // This bit is important.  It detects/adds XMLHttpRequest.sendAsBinary.  Without this
    // you cannot send image data as part of a multipart/form-data encoded request from
    // Javascript.  This implementation depends on Uint8Array, so if the browser doesn't
    // support either XMLHttpRequest.sendAsBinary or Uint8Array, then you will need to
    // find yet another way to implement this.

    // from: http://stackoverflow.com/a/5303242/945521

    if ( XMLHttpRequest.prototype.sendAsBinary === undefined  ) {
        XMLHttpRequest.prototype.sendAsBinary = function(string) {
            var bytes = Array.prototype.map.call(string, function(c) {
                return c.charCodeAt(0) & 0xff;
            });
            this.send(new Uint8Array(bytes).buffer);
        };
    }

    // This function takes an array of bytes that are the actual contents of the image file.
    // In other words, if you were to look at the contents of imageData as characters, they'd
    // look like the contents of a PNG or GIF or what have you.  For instance, you might use
    // pnglib.js to generate a PNG and then upload it to Facebook, all from the client.
    //
    // Arguments:
    //   authToken - the user's auth token, usually from something like authResponse.accessToken
    //   filename - the filename you'd like the uploaded file to have
    //   mimeType - the mime type of the file, eg: image/png
    //   imageData - an array of bytes containing the image file contents
    //   message - an optional message you'd like associated with the image

    function postImageToFacebook( authToken, filename, mimeType, imageData, message  )
    {
    // this is the multipart/form-data boundary we'll use
    var boundary = '----ThisIsTheBoundary1234567890';

    // let's encode our image file, which is contained in the var
    var formData = '--' + boundary + '\r\n'
    formData += 'Content-Disposition: form-data; name="source"; filename="' + filename + '"\r\n';
    formData += 'Content-Type: ' + mimeType + '\r\n\r\n';
    for ( var i = 0; i < imageData.length; ++i  )
    {
    formData += String.fromCharCode( imageData[ i  ] & 0xff  );

    }
    formData += '\r\n';
    formData += '--' + boundary + '\r\n';
    formData += 'Content-Disposition: form-data; name="message"\r\n\r\n';
    formData += message + '\r\n'
    formData += '--' + boundary + '--\r\n';

    var xhr = new XMLHttpRequest();
    xhr.open( 'POST', 'https://graph.facebook.com/me/photos?access_token=' + authToken + '&debug=all', true  );
    xhr.onload = xhr.onerror = function() {
    app.dMessage('Error', xhr.responseText  );

    };
    xhr.setRequestHeader( "Content-Type", "multipart/form-data; boundary=" + boundary  );
    xhr.sendAsBinary( formData  );

    }

    function dataURItoBlob(dataURI,mime) {
        var BASE64_MARKER = ';base64,';
        var base64Index = dataURI.indexOf(BASE64_MARKER);
        dataURI = dataURI.substring(base64Index + BASE64_MARKER.length);
        var byteString = window.atob(dataURI);
        var ia = new Uint8Array(byteString.length);
        for (var i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);

        }
        return new Blob([ia], { type: mime  });

    }

    function publishOnFacebook1(imageData, mimeType){
        var blob = dataURItoBlob(imageData,mimeType);
        FB.getLoginStatus(function(response){
            if (response.authResponse){
            //facebook set up
                FB.ui(
                    'me/objects/game',
                    'post',
                    {'object': {
                        'og:url': 'http://samples.ogp.me/163382137069945',
                        'og:title': 'Sample Game',
                        'og:type': 'game',
                        'og:image': blob,
                        'og:description': 'Sample Game Description',
                        'fb:app_id': '1518603065100165'
                        }
                    },
                    function(response){
                        app.dMessage("Success", response);
                    }
                );
                var fd = new FormData();
                fd.append("access_token",FB.getAuthResponse()['accessToken']);
                fd.append("source", blob);
                fd.append("message",$('.winnerTitle p:first').text());

               //$.ajax({
                    //url:'https://graph.facebook.com/v2.5/me/photos',
                    //type:"POST",
                    //data:fd,
                    //processData:false,
                    //contentType:false,
                    //cache:false,
                    //success: function(){
                        //app.dMessage("Success", "Posted to Facebook");
                    //},
                    //error: function(e){
                        //app.dMessage(e.name ,e.message);
                        ////on error fall back to the hacked method
                        //publishOnFacebook(imageData);
                   //}
                //});
            }
        });
    }

    function publishOnFacebook(data) {
        var message = $('.winnerTitle p:first').text();
        var encodedPng = data.substring(data.indexOf(',') + 1, data.length);
        var decodedPng = atob(encodedPng);
        var fileName = "generated_image";
        FB.getLoginStatus(function(response){
            if (response.authResponse){
                postImageToFacebook(
                    FB.getAuthResponse()['accessToken'],
                    fileName,
                    "image/png",
                    decodedPng,
                    message
                );
                alert("Posted to Facebook!");
                app.dMessage("Success", "Posted to Facebook");
            } else {
                app.dMessage("error", 'User cancelled login or did not fully authorize.' );
            }
        });
    }

    function shareGameResult(){
       //facebook set up

        FB.getLoginStatus(function(response){
            if (response.authResponse){
                FB.ui({
                    method: 'share_open_graph',
                    action_type: 'isaiditbest:win',
                    action_properties: JSON.stringify({
                        game: window.location.href,
                        url: "https://www.Isaiditbest.com",
                        message: $('.winnerTitle').text(),
                    })
                },function(response){
                     post = response;
                     msgOpt = {
                            buttons: {
                                Yes: function(){
                                    FB.api(
                                        "/" + post.post_id,
                                        "DELETE",
                                        function(response){
                                            console.log("DELETE POST");
                                            console.log(response);
                                        }
                                    )
                                    $(this).dialog('close');
                                },
                                No: function(){ $(this).dialog('close'); }
                            }
                    }
                     app.dMessage("Remove Post?", post, msgOpt);
                },{access_token: FB.getAuthResponse()['accessToken'] }
                );
            }
        });
        return true;
    }

    function shareCanvas(){
        //get canvas image
        html2canvas($('#winner'), {
            logging: true,
            width: 200,
            height: 200
        }).then(function(canvas){
            mimeType = "image/png";
            data = canvas.toDataURL(mimeType);
            publishOnFacebook1(data,mimeType);
        })
    }




    $('#LD').click(function(){
        // load data to display function
        $(gamePanel).click();
        loadDebate(lib.sampleGameStartData);
    });

    $('#LC').click(function(){
        // load data to display function
        $(gamePanel).click();
        $('#selectable').remove();
        displayComments(lib.sampleCommentResultData[0].users);
    });


    $('#TGV').click(function(){
        toggleGame();
    });

    $('#TW').click(function(){
        if (!$(resultPanel).is(':visible')){
            loadWinner(lib.sampleVoteResultData);
        }else{
            toggleParams();
            $(resultPanel).toggle();
            $(gamePanel).click();
        }
    });

    $('#TS').click(function(){
        postData = {
            'id': 'scripts/payoutExperiment',
            'function': 'winner',
            'winner' : 'tonym415',
            'url' : 'tempBrowseLocal.html',
            'wager_amount' : 10 ,
            'question' : "Yadda or Blah?",
            'text_image' : 'img.png',
            'user_response' : 'BLAH, BLAH, BLAH',
            'game_id' : 4
            }
        $.ajax({
            url: app.engine,
            data: postData,
            type: 'POST',
            dataType: 'json',
            desc: 'Script Test',
            success: function(result){
                console.log(result)
                app.dMessage("Alert", result);
            },
            error: function(e){
                app.dMessage(e.name ,e.message);
            }
        })
        $.unblockUI();
    });


    /**
     * Toggle betwee the paramPanel and the gamePanel
     */
    function toggleParams(){
        // disable/enable gameParameters
        $(paramPanel).toggleClass('ui-state-disabled');
        // disable/enable game
        $(gamePanel).toggleClass('ui-state-disabled');
    }

    /**
     * Toggle between game and vote panels
     *
     */
    function toggleGame(){
        $('#debate, .debateVote').toggle();
    }

    /**
     * Game Clock instantiation
     * @returns {$.fn.FlipClock}
     */
    gameClock = $('#game_timer').FlipClock({
        autoStart: false,
        countdown: true,
        clockFace: 'MinuteCounter',
        callbacks: {
            stop: function(){
                data = $('#gameUI').serializeForm();
                data.user_id = user.user_id;
                if (!gameSubmitted) submitGame(data);
            }
        }
    });
    /**
     *  Wait Clock instantiation
     * @returns {$.fn.FlipClock}
     */
    waitClock = $('#wait_timer').FlipClock(10,{
        autoStart: false,
        countdown: true,
        clockFace: 'MinuteCounter',
        callbacks: {
            stop: function(){
                $.unblockUI();
                gameClock.start();
                $('#gameWait').addClass('hidden');
            }
        }
    });

    function loadDebate(data, testing){
        var runtimers = (testing !== undefined)
        // set game id
        $('#game_id').val(data.game_id);

        // load player avatars
        $('#players')
        .empty()
        .html("Players");

        $.each(data.users, function(){
            $('<div />')
            .attr({ id: this.username })
            .appendTo('#players');
            $('<img  />')
            .attr({
                class: 'avatar',
                src: app.getAvatar(this.avatar),
                title: this.username
            })
            .appendTo('#' + this.username);
            $('<br />').appendTo('#players');
        });

        // disable waiting message
        $('#game_panel').unblock();

        //set game title(question)/wager
        $("#question")
        .html(data.question)
        .append(
            $('<h5>')
            // .addClass('ui-state-active')
            .html("(Wager: " + data.wager + " credit".pluralize(data.wager) + ")")
        );

        if (runtimers){
            // set clock based on time limit parameter
            gameClock.setTime(data.time);
            // show waitclock
            $('#gameWait').removeClass('hidden');
            $.blockUI({message: $('#gameWait'), css:{ width: '305px'}});
            waitClock.start();
        }
    }

    /**
     * Click event for canceling a search for a game
     * @event module:game#cancel_click
     */
    $('#cancel').click(function(){
        $('#game_panel').unblock();
        // enable/disable appropriate panels
        toggleParams();
        openAccordionPanel('last');
        cancelGame().success(function(data){
            // cancel poll
            clearTimeout(timeout);
            if (!data.error){
                func = function(){
                    gameParameters.counter = pollCounter = 0;
                    $(this).dialog('close');
                };
                msgOpt = {
                    buttons: {
                        Yes: function(){
                            getGame();
                            func();
                        },
                        No: func
                    }
                };
                app.dMessage(
                    "Alert",
                    'Cancellation Confirmed<p>Retry?</p>',
                    msgOpt
                );
            }else{
                app.dMessage(data.error, data.stm);
            }
        });
    });

    /**
     * Function used as callback to determine the success
     * of the cancellation
     * @Callback cancelGame
     */
    function cancelGame(callback){
        gameParameters.function = 'CG';
        gameParameters.id = 'cancelGame';
        return $.ajax({
            url: app.engine,
            data: gameParameters,
            type: 'POST',
            dataType: 'json',
            desc: 'Game Cancellation'
        });
    }

    /**
     * Opens an accordion panel at a certain position
     * @method
     */
    function openAccordionPanel(position) {
        var current = app.accordion.accordion("option","active");
        maximum = app.accordion.find("h3").length;
        if (position === 'next'){
            position = current+1 === maximum ? 0 : current+1;
        }else{
            position = current-1 < 0 ? 0 : current-1;
        }
        app.accordion.accordion("option","active",position);
    }


    /**
     * Load question box with values based on category/subcategory
     * @method
     */
    function primeQBox(catID){
        // destination selectmenu
        q_select = '#paramQuestions';
        // reset questions list
        $(q_select)
        .empty()
        .selectmenu('destroy')
        .selectmenu({width: '100%', style: 'dropdown'})
        .append(new Option("None", ""));

        // retrieve and load questions for selected id
        app.getCatQuestions(catID, q_select);
    }

    $("select[id*=Category]:not([id*=temp])")
        /**
         * Set a watch for additions/removal on the dom for select boxes (not including template)
         * @event module:game#Category_livequery
         * @type {$.fn.livequery}
         */
        .livequery(function(){
            // id = $(this).prop('id');
            id = '#' + $(this)[0].form.id + " " +  $(this).prop('id');
            // add validation
            $(this).closest('form').validate();
            $(this).rules("add", { selectNotEqual : "" });

            // selectmenu options
            mnuOpts = {
                change: function(){
                    // load appropriate questions for selection
                    primeQBox($(this).val());

                    // validate select
                    $(this).closest('form').validate().element(this);
                    //  bind change event to all select menus to enable subcategory menu selection
                    boolSubs = $(this).siblings('input').prop("checked");

                    // get clones if present
                    clones = $(this).parent().siblings('.clone');
                    hasClones = clones.length > 0;
                    // remove clones
                    if (hasClones){
                        // kill all clones below current check
                        $.each(clones, function(){
                            $(this).remove();
                        });
                    }

                    // if sub-categories are requested
                    if (boolSubs) app.subCheck($(this));
                }
            };
            settings = $.extend({}, app.selectMenuOpt, mnuOpts);
            $(this).selectmenu(settings);
        });

    $("input[id*=CategoryChk]:not([id*=temp])")
        /**
         * Set watch for additions/removal on the dom for checkboxes (not including template)
         * @event module:game#CategoryChk_livequery
         * @type {$.fn.livequery}
         */
        .livequery(function(){
            $(this)
                .change(function(event){
                    event.stopPropagation();
                    if($(this).is(':checked')){
                        var select = $(this).siblings('select');
                        app.subCheck(select);
                    }else{
                        // load appropriate questions for selection
                        primeQBox("#" + $(this).siblings('select').prop('id'));

                        // get all p tags that are not the original and do not contain the submit button
                        cloneP = $(this).parent().siblings('.clone');
                        // kill all clones below current check
                        $.each(cloneP, function(){
                            $(this).remove();
                        });
                    }
                });
        });


    /**
    * ON HOLD - TODO - Provide account resolution for native players and players logging in
    * from social media
    *
    */
    //$('.mergeWarning').on('click', getMergeAccounts);

    function getMergeAccounts(){
        // retrieve user accounts with the same email
        user = app.getCookie('user');
        data = {
           'function': "userFunctions",
           'id': 'resolveUserAccounts',
           'user_id': user.user_id
        },
        $.ajax({
            data: data,
            url: app.engine,
            type: 'POST',
            desc: 'utility (retrieve user conflicts)',
            success: function(result){
                // open modal to resolve conflict
                renderMergeForm(result, user);
            }
        });
    }

    function renderMergeForm(data, user){
        $('#placeHolder')
            .removeClass('hidden')
            .load('templates.html #merger', function(response, status, xhr){
                $.each(data, function(){
                    info = "<p class='list-group-item-text'>Full Name: " + this.first_name + " " + this.last_name + "</p>" +
                        "<p class='list-group-item-text'>Username: " + this.username + "</p>" +
                        "<p class='list-group-item-text'>Created: " + this.created + "</p>"

                    if (this.user_id == user.user_id){
                         $('#current').html(info)
                    }else{
                        $('#suggested').append(
                            $('<div class="panel panel-default">')
                                .append(
                                    $('<div class="panel-heading">')
                                        .append(
                                            $('<h4 class="panel-title">')
                                                .append(
                                                    $('<a>')
                                                        .prop('href', "#" + this.username)
                                                        .attr('data-toggle', "collapse")
                                                        .attr('data-parent', "#suggested")
                                                        .text('Are you, ' + this.first_name + ' ' + this.last_name + '?')
                                                    )
                                            ),
                                    $('<div class="panel-collapse collapse">')
                                        .prop('id', this.username)
                                        .append(
                                            $('<div>').html(info),
                                            $('<p>'),
                                            $('<form>')
                                                .prop('id', this.username + '_form')
                                                .prop('action', "")
                                                .append(
                                                    $('<label>').text('User:'),
                                                    $('<input readonly type="text"  name="' + this.user_id + '_username">')
                                                        .val(this.username),
                                                    $('<label>').text('Password:'),
                                                    $('<input type="text" name="' + this.user_id + '_password">')
                                                )
                                        )
                                )
                        )
                    }
            });
            $("#merger").modal('show').css({'margin-top': '15%'});
            $("#confirmMerge").on('click', selectMergeAccount)
        });
    }

    function selectMergeAccount(){
         // get uname/password
        frm = $('#suggested').find('.in').find('form')
        data = $(frm).serializeForm()
        console.log(data);
        // TODO - 1. query the db to validate login
        // 2. if valid user find out what values to keep in the users table and
        // 3. generate "keep/toss" form for users table
        // 4. On the server-side "merge" accounts
    }

});
