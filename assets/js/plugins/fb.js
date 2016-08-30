define(['facebook'], function(){

    function statusChangeCallback(response){
        console.log('statusChangeCallback');
        console.log(response);
        if (response.status === 'connected'){
            testAPI();
        }else if (response.statuse === 'not_authorized'){
            return "Please log in to this app";
        }else{
            return "Please log in to Facebook";
        }
    }

    function handleSessionResponse(response){
        // if we don't have a session (which means the user has been logged out, redirect the user)
        if (!response.authResponse){
            window.location = "/index.html";
            return;
        }
        //if we do have non-null response.session, call FB.logout(),
        //the JS method will log the user out of Facebook and remove any authorization cookies
        FB.logout(response.authResponse);
    }

    function fbLogout(){
        response = checkLoginState();
        if (response && response.status === 'connected'){
            FB.logout(response.authResponse);
        }
    };

    function checkLoginState(){
        FB.getLoginStatus(function(response){
            statusChangeCallback(response);
            return response;
        });
    };

    function testAPI(){
        console.log('Welcome! Fetching your information...');
        FB.api('/me', function(response){
            console.log("Successful login for: " + response.name);
            console.log("Thanks for logging in, " + response.name + "!");
        })
    }
    FB.init({
        appId      : '1518603065100165',
        status     : false,
        cookie     : true,  // enable cookies to allow the server to access the session
        xfbml      : true,  // parse social plugins on this page
        version    : 'v2.6' // use version 2.2
    });

    FB.Event.subscribe('authLogin', checkLoginState );
    FB.Event.subscribe('authStatusChange', checkLoginState );
    FB.Event.subscribe('authResponseChange', checkLoginState);

    FB.getLoginStatus(function(response){
        statusChangeCallback(response);
    });


    return {
        checkLoginState: checkLoginState,
        statusChangeCallback: statusChangeCallback,
        testAPI: testAPI,
        fbLogout: fbLogout
    };

});
