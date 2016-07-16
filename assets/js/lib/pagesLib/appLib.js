/**
* @fileOverview
*Library For: {@link appModule AppModule}
*Contents:
*-    navigation pages hash
*-    skill levels hash
*-    Rules text
*-    JQuery addons
*-    JS prototypes
*-    Helper functions
*
* When the module is loaded it will be referred to as "lib"
* @author Tony Moses
* @version 0.1
* @namespace appLib
* @returns {Object} Returns library of config vars and functions
*/
define(['jquery','tooltipster','validate'], function($) {

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



    /**
     * Utility function to format theme name correctly
     * @private
     * @method escapeId
     * @param {string} myId element id
     * @returns {string}
     *
     */
    function escapeId(myID){
        return "#" + myID.replace(/[!"#$%&'()*+,.\/:;<=>?@[\\\]^`{|}~]/g, "\\\\$&");
    }



    /**
     * @name appLib#navPages
     * @readonly
     * @prop {string} key navPages.key
     * @prop {string} value navPages.value
     * @desc
     * For usage example see:
     * - [Navigation Bar]{@link module:app~loginNavBar} <a href='app.js.html#sunlight-1-line-348'> (app.js line 348)</a>
     * @example
     * // returns "index.html
     * lib.navPages.home;
     * @returns {string} Returns file name for alias
    */
    var navPages = {
        'home' : 'index.html',
        'game' : 'game.html',
        'feedback': 'feedback.html',
        'profile': 'profile.html',
        'about': 'about.html',
        'admin': 'admin.html'
    };

    /**
     * @name appLib#skillLevels
     * @readonly
     * @prop {string} title
     * @prop {string} description
     * @desc This is an array of objects containing skill title/desc. This object will be used to
     * refer to site pages and helps preserve DRY method.
     * For usage example see: {@link module:app~getLevelName} <a href='app.js.html#sunlight-1-line-407'> (app.js line 104)</a>
     * @returns {string} Returns file name for alias
    */
    var skillLevels = [{
            "title" : "Blowhard",
            "description" : "Look who hasn't even won eleven games....."
        },{
            "title" : "Bigmouth",
            "description" : "Get some games under you belt and we'll talk"
        },{
            "title" : "Conversationalist",
            "description" : "Looks like someone is making money"
        },{
            "title" : "Commentator",
            "description" : "Gaining momentum"
        },{
            "title" : "Scholar",
            "description" : "Look who can argue!"
        },{
            "title" : "Lecturer",
            "description" : "Debater Spectacular"
        },{
            "title" : "Advocate",
            "description" : "You know your stuff"
        },{
            "title" : "Orator",
            "description" : "Basically, Winston Churchill."
        },{
            "title" : "Elocutionist",
            "description" : "Straight winning"
        },{
            "title" : "Rhetorician",
            "description" : "Apex"
        }
    ];

    // rules div
    /**
     * @var tplRules
     * @memberof appLib
     * @desc template for site rules
     * @todo Move template string to site template html
     */
    var tplRules = "<div class='agreement_text' style='display:none;'> \
                    <div class='rules'> \
                        <h2>Rules and Regulations</h2> \
                        <ol> \
                            <li> \
                                While <b><i>Isaiditbest</b></i> allows great leniency regarding freedom of speech while debating, Isaiditbest reserves the right to suspend or revoke membership to any member for anything that <b><i>Isaiditbest</b></i> determines is hate speech. Similarly, any intimidating language towards other members is also strictly prohibited. By using this website, all users acknowledge that Wesaiditbest retains the right to make these decisions regarding who may debate on our website. \
                            </li> \
                            <li> \
                                Group coordination, where there is a prearranged agreement between multiple members to vote for each other, is strictly prohibited.<br /> \
                                <p> \
                                    By using this website, all users acknowledge that any attempt to perform these actions will result in a ban and potential forfeit of remaining credit, which may be used only for the purposes of reimbursing potentially harmed contestants. Any use of this website comes with the knowledge that Isaiditbest retains the right to determine whether group coordination occurred and take these listed actions. Any customers facing potential suspension or credit forfeit will be given a minimum of 72 hours to appeal our decision. By using this website, all users give their consent to <b><i>Isaiditbest</b></i> to determine if group coordination occurred and undertake the actions mentioned in this document. \
                                </p><br /> \
                                <p> \
                                    <b><i>Isaiditbest</i></b> retains the right to make any and all decisions regarding who may use this website and all game decisions, including retroactive game decisions in the case that group coordination is believed to have occurred. By signing up and participating in games, I agree to these terms. \
                                </p> \
                            </li> \
                        </ol> \
                        <br> \
                        <p> \
                            <a class='agreement_close' href='#'>Close this dialog</a> \
                        </p> \
                    </div>";


    /**
     * @memberof appLib
     * @var txtFooter
     * @desc Visible footer text
     */
    var txtFooter = "Use of this website constitutes acceptance of the ISaidItBest \
        <a class=\"agreement\" href=\"#\">Rules Agreement</a>";

    /**
     * @global
     * @method tooltipster.setDefaults
     * @desc Set default values for tooltipster plugin
     */
    $.fn.tooltipster('setDefaults',{
        trigger: 'custom',
        onlyOne: false,
        positionTracker: true,
        position: 'right',
        updateAnimation: false,
        animation: 'swing',
        positionTrackerCallback: function(){
            this.hide();
        }
    });

    /**
     * @global
     * @method between
     * @desc  Extends javascript Number to have a between function
     * The function takes number and returns if that number is between the two
     * parameters
     * @param {number} min Minumum comparator
     * @param {number} max Maximum comparator
     * @example
     * //retuns true
     * 42.between(40, 50);
     * @return {Boolean} Boolean
     */
     Number.prototype.between = function(min, max){
         return this.valueOf() >= min && this.valueOf() <= max;
     };

     /**
       * @global
     * @method pluralize
     * @desc  Extends javascript String
     * The function takes string and returns pluralized version based on count
     * @param {number} count Thec count of items to base pluralization on
     * @param {string} [plural=s] Plural string
     * @example
     * //retuns cats
     * cat.pluralize(10);
     * @return {String} Pluralized string
     */
    String.prototype.pluralize = function(count, plural){
        if (plural == null){
            plural = this + 's';
        }
        return (count == 1 ? this : plural);
    };

    /**
     * @global
     * @method capitalize
     * @desc  Extends javascript String
     * The function takes string and returns capitalized string
     * @example
     * //returns Error
     * var status = "error";
     * status.capitalize();
     * @return {String} capitalized string
     */
    String.prototype.capitlize = function(){
        return this.toLowerCase().replace( /\b\w/g, function(m){
            return m.toUpperCase();
        });
    };

    /**
     * @global
     * @method prefix
     * @desc  Extends javascript String
     * The function finds a prefix of a string based on a separator string
     * @param {string} [separator=_] String to mark prefix
     * @example
     * //retuns sub
     * var id = "sub_Category"
     * status.prefix();
     * @return {String} prefix of string
     */
    String.prototype.prefix = function (separator) {
        separator = (separator === undefined) ? '_' : separator;
        return this.substring(0, this.indexOf(separator) + 1);
    };

    /**
     * @global
     * @method serializeForm
     * @desc  Extends JQuery fn
     * Converts form data to js object
     * @example
     * //retuns form in js object
     * @return {object} formdata
     */
    $.fn.serializeForm = function() {
        var o = {"id": this.prop('id')};

        var a = this.serializeArray();
        $.each(a, function() {
            if (o[this.name] !== undefined) {
                if (!o[this.name].push) {
                    o[this.name] = [o[this.name]];
                }
                o[this.name].push(this.value || '');
            } else {
                o[this.name] = this.value || '';
            }
        });
        return o;
    };

    /**
     * @global
     * @method toMMSS
     * @desc  Extends Javascript String
     * Converts seconds as string/int to HH:MM:SS
     * @example
     * //returns
     * @return {string} string
     */
    String.prototype.toMMSS = function () {
        var sec_num = parseInt(this, 10); // don't forget the second param
        var hours   = Math.floor(sec_num / 3600);
        var minutes = Math.floor((sec_num - (hours * 3600)) / 60);
        var seconds = sec_num - (hours * 3600) - (minutes * 60);

        // if (hours   < 10) {hours   = "0"+hours;}
        if (minutes < 10) {minutes = "0"+minutes;}
        if (seconds < 10) {seconds = "0"+seconds;}
        // var time    = hours+':'+minutes+':'+seconds;
        var time    = minutes+':'+seconds;
        return time;
    };

    /**
     * This function take a key or array of keys to search an object for
     * @memberof appLib
     * @method objHasKeys
     * @param {string|array} key|keylist key or list of keys to look for in an object
     * @param {object} object object to search
     * @returns {object} object contains status and array of missing keys
     * @example
     * // object to search
     * {
     *   "email": "lj14thechampion@gmail.com",
     *   "first_name": "B'Liahl",
     *   "last_name": "Detwiler",
     *   "id": "905954012853806"
     * }
     *
     * // keys list
     * [
        'email',
        'first_name',
        'last_name',
        'birthday'
        ]
     *
     * // result
     * {
     *   "status": false,
     *   "missing": [
     *      "birthday"
     *    ]
     * }
     */
    function objHasKeys(keys, object){
        var retObj = {status: true, missing: []}
        if (!Array.isArray(keys)){
            keys = [keys]
        }
        $.each(keys, function(idx, val){
            if (!object.hasOwnProperty(val)){
                retObj['status'] = false;
                retObj['missing'].push(val)
            }
        })
        return retObj;
    }

    function getCookie(name) {
        var value = "; " + document.cookie;
        var parts = value.split("; " + name + "=");
        if (parts.length == 2) return parts.pop().split(";").shift();
    }
    return {
        getCookieByName: getCookie,
        navPages: navPages,
        skillLevels: skillLevels,
        objHasKeys: objHasKeys,
        /**
        * @method getFooterText
        * @memberof appLib
        * @see {@link txtFooter}
        * @see {@link app/appLogin~tplRules}
        */
        getFooterText: function(){ return txtFooter + tplRules;}
    }
});
