/**
* @fileOverview
*  Library: Game
*  Contents:
*  - Sample Data for testing
*
* When the module is loaded it will be referred to as "lib"
* @author Tony Moses
* @version 0.1
* @namespace gameLib
* @memberof module:game
* @returns {Object} Returns library of config vars and functions
*/
define(['jquery'], function($) {
    /**
     * @method getWinner
     * @memberof gameLib
     * @desc get winner with most votes
     * @param {object} data function takes data sample (vData)
     * @todo Make function more generic. Improve this function to handle
     * ties or more than one object with same result value
     * possible: able to search "obj" for max, min, etc based on params
     * @returns {obj} the player object
     * @see gsData (sample data)
    */
    var getWinner = function(data){
        // get the highest vote count of the users array
        var result = Math.max.apply(Math, data.map(function(o){return parseInt(o.votes);}));
        // get the highest vote count of the users array
        var sumWager = 0;
        for (var i=data.length; i--;){
            sumWager+=parseInt(data[i].wager);
        }

        returnObj = {
            "pot" : sumWager,
            // get the object the matches the max
            "winner" : data.find(function(o){ return o.votes == result; })
        };
        return returnObj;
    };

    /**
     * Sample game data
     * @name gsData
     * @enum {object}
     * @memberOf gameLib
     * @example
     * var gsData = {
        "wager": 1,
        "users": [
            {
                "username": "bobs",
                "avatar": "54_avatar.jpg"
            },{
                "username": "user",
                "avatar": "52_avatar.jpg"
            },{
                "username": "tonym415",
                "avatar": "36_avatar.jpg"
        }],
        "status": "complete",
        "time": 60,
        "question": "Is the introduction of $15 minimum wage good?",
        "game_id": 5
    }; */
    var gsData = {
        "wager": 1,
        "users": [
            {
                "username": "bobs",
                "avatar": "54_avatar.jpg"
            },{
                "username": "user",
                "avatar": "52_avatar.jpg"
            },{
                "username": "tonym415",
                "avatar": "36_avatar.jpg"
        }],
        "status": "complete",
        "time": 60,
        "question": "Is the introduction of $15 minimum wage good?",
        "game_id": 5
    };

    /**
     * Sample comment data
     * @enum {array}
     * @memberOf gameLib
     * @example
     * var comData = [{
        "pending": 0,
        "status": "complete",
        "users": [{
            "thoughts": "Bacon ipsum dolor amet jerky rump ham hock, shank shankle venison brisket kielbasa drumstick. Brisket swine short ribs ribeye ball tip spare ribs. Chicken pork loin shoulder pancetta pork ham venison drumstick chuck boudin kevin cow fatback porchetta pastrami. Shank pork belly ham, capicola beef kielbasa salami tail short ribs ground round cow shoulder turkey. Jerky pig doner, capicola kevin bresaola meatball tongue cow short loin ground round pork belly filet mignon. Ground round salami hamburger, beef picanha swine prosciutto bacon pork chop cow tongue ball tip. Pork chop rump porchetta t-bone, short ribs pork loin sausage filet mignon tri-tip picanha salami shoulder.",
            "avatar": "36_avatar.jpg",
            "username": "tonym415",
            "user_id": 36
        }, {
            "thoughts": "Bresaola biltong chuck shank sirloin bacon venison ground round prosciutto short loin. Brisket venison jowl salami sirloin landjaeger. Short ribs ham hock filet mignon jowl. Bresaola pig porchetta tri-tip drumstick prosciutto tenderloin rump capicola bacon tongue flank short loin ham hock t-bone. Meatball venison chicken, cupim pork loin frankfurter sirloin tail. Drumstick chuck fatback turkey, bresaola ham shoulder meatball sausage biltong strip steak sirloin filet mignon beef.",
            "avatar": "52_avatar.jpg",
            "username": "user",
            "user_id": 52
        }, {
            "thoughts": "sBeef ribs meatloaf kielbasa ham, rump tail flank doner ground round turducken t-bone. Doner turkey kevin tail, cupim shank bacon venison. Flank boudin pork chop, shoulder tenderloin picanha bresaola capicola leberkas pig shank fatback rump ball tip beef. Rump biltong pig, sirloin short loin jowl kevin tongue short ribs leberkas corned beef pancetta. ",
            "avatar": "54_avatar.jpg",
            "username": "bobs",
            "user_id": 54
        }]
    }]; */
    var comData = [{
        "pending": 0,
        "status": "complete",
        "users": [{
            "thoughts": "Bacon ipsum dolor amet jerky rump ham hock, shank shankle venison brisket kielbasa drumstick. Brisket swine short ribs ribeye ball tip spare ribs. Chicken pork loin shoulder pancetta pork ham venison drumstick chuck boudin kevin cow fatback porchetta pastrami. Shank pork belly ham, capicola beef kielbasa salami tail short ribs ground round cow shoulder turkey. Jerky pig doner, capicola kevin bresaola meatball tongue cow short loin ground round pork belly filet mignon. Ground round salami hamburger, beef picanha swine prosciutto bacon pork chop cow tongue ball tip. Pork chop rump porchetta t-bone, short ribs pork loin sausage filet mignon tri-tip picanha salami shoulder.",
            "avatar": "36_avatar.jpg",
            "username": "tonym415",
            "user_id": 36
        }, {
            "thoughts": "Bresaola biltong chuck shank sirloin bacon venison ground round prosciutto short loin. Brisket venison jowl salami sirloin landjaeger. Short ribs ham hock filet mignon jowl. Bresaola pig porchetta tri-tip drumstick prosciutto tenderloin rump capicola bacon tongue flank short loin ham hock t-bone. Meatball venison chicken, cupim pork loin frankfurter sirloin tail. Drumstick chuck fatback turkey, bresaola ham shoulder meatball sausage biltong strip steak sirloin filet mignon beef.",
            "avatar": "52_avatar.jpg",
            "username": "user",
            "user_id": 52
        }, {
            "thoughts": "sBeef ribs meatloaf kielbasa ham, rump tail flank doner ground round turducken t-bone. Doner turkey kevin tail, cupim shank bacon venison. Flank boudin pork chop, shoulder tenderloin picanha bresaola capicola leberkas pig shank fatback rump ball tip beef. Rump biltong pig, sirloin short loin jowl kevin tongue short ribs leberkas corned beef pancetta. ",
            "avatar": "54_avatar.jpg",
            "username": "bobs",
            "user_id": 54
        }]
    }];

    /**
     * Sample vote Data
     * @enum {array}
     * @memberOf gameLib
     * @example
     * var vData = [{
        "votes": 1,
            "user_id": 36,
            "avatar": "36_avatar.jpg",
            "wager" : 10,
            "username": "tonym415"
          }, {
            "votes": 2,
            "user_id": 52,
            "avatar": "52_avatar.jpg",
            "wager" : 10,
            "username": "user"
          }, {
            "votes": 0,
            "user_id": 54,
            "avatar": "54_avatar.jpg",
            "wager" : 10,
            "username": "bobs"
        }];
     */
    var vData = [{
        "votes": 1,
            "user_id": 36,
            "avatar": "36_avatar.jpg",
            "wager" : 10,
            "username": "tonym415"
          }, {
            "votes": 2,
            "user_id": 52,
            "avatar": "52_avatar.jpg",
            "wager" : 10,
            "username": "user"
          }, {
            "votes": 0,
            "user_id": 54,
            "avatar": "54_avatar.jpg",
            "wager" : 10,
            "username": "bobs"
    }];

    return {
        sampleVoteResultData: vData,
        sampleCommentResultData: comData,
        sampleGameStartData: gsData,
        getWinner: getWinner    // TODO: make generic
    };

});
