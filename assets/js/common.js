/**
 *  The first JS file to be loaded. Takes care of setting up all of the
 *  required paths
 */

// configure RequireJS
requirejs.config({
    baseURL: "assets/js",
    waitSeconds: 15,
    paths: {
        // global application object
        app: 'app',
        // app libraries
        appLib: 'lib/pagesLib/appLib',
        adminLib: 'lib/pagesLib/adminLib',
        gameLib: 'lib/pagesLib/gameLib',
        // The libraries to be used
        jquery: [
            '//ajax.googleapis.com/ajax/libs/jquery/1.11.3/jquery',
            // if the CDN location fails, load from this location
            'plugins/jquery-1.11.3'
        ],
        jqueryUI: [
            '//ajax.googleapis.com/ajax/libs/jqueryui/1.11.3/jquery-ui',
            // '//code.jquery.com/ui/1.11.4/jquery-ui.min',
            // if the CDN location fails, load from this location
            'plugins/jquery-ui'
        ],
        validate: [
            '//cdn.jsdelivr.net/jquery.validation/1.14.0/jquery.validate',
            // if the CDN location fails, load from this location
            'plugins/jquery.validate'
        ],
        html2canvas: 'plugins/html2canvas',
        additional_methods: 'plugins/additional-methods',
        // pluginss
        livequery: 'plugins/jquery.livequery',
        flipclock: 'plugins/flipclock',
        cookie: 'plugins/jquery-cookie',
        steps: 'plugins/jquery.steps',
        blockUI: 'plugins/jquery.blockUI',
        avatar: 'plugins/avatar',
        tooltipster: 'plugins/jquery.tooltipster',
        upload: 'plugins/jquery.fileupload',
        bootstrap : [
             '//netdna.bootstrapcdn.com/bootstrap/3.1.1/js/bootstrap.min',
            //'plugins/bootstrap'
        ],
        fileInput : 'plugins/fileinput.min',
        jqGrid: [
            // '//cdnjs.cloudflare.com/ajax/pluginss/jqgrid/4.6.0/js/i18n/grid.locale-en',
            'plugins/grid.locale-en'
            ],
        jqGridSrc: [//'//cdnjs.cloudflare.com/ajax/pluginss/jqgrid/4.6.0/js/jquery.jqGrid.src',
            'plugins/jquery.jqgrid.src'],
        facebook: '//connect.facebook.net/en_US/all',
        ud_facebook: 'plugins/fb'  // user defined Facebook functions
    },
    shim: {
        jquery: {
            exports: '$'
        },
        jqueryUI: {
            exports: '$',
            deps: ['jquery']
        },
        jqGridSrc: {
            exports: 'jqGridSrc',
            deps: ['jquery', 'jqueryUI']
        },
        jqGrid: {
            deps: ['jqueryUI', 'jqGridSrc']
        },
        tooltipster: {
            deps: ['jquery']
        },
        qtip: {
            deps: ['jquery']
        },
        upload: {
            deps: ['jquery', 'jqueryUI']
        },
        bootstrap: {
            deps: ['jquery']
        },
        facebook: {
            exports: 'FB'
        },
        ud_facebook: {
            deps: ['facebook'],
            exports: 'udFB'
        },
         additional_methods: {
          deps:['validate']
         }
    }
});
