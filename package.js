Package.describe({
    name: "meteoric124:template-scope",
    summary: "Replication of the angular's $scope mechanism.",
    version: "0.1.0-beta.7",
    git: "https://github.com/meteoric124/meteor-template-scope.git"
});

Package.onUse(function(api) {
    api.versionsFrom("1.3.2.4");

    api.use([
        'ecmascript'
    ]);

    api.use([
        "jandres:template-extension@4.0.7-alpha3",
        'underscore',
        'templating',
        'jquery'
    ], 'client');

    api.mainModule('lib/main.js', 'client');

    // todo: Use es6 import.
    api.export('$Scope');
    api.export('$rootScope');
});

Package.onTest(function(api) {
    api.use('meteoric124:template-scope');
    api.use([
        'sanjo:jasmine@1.0.1',
        'velocity:html-reporter',

        'ecmascript'
    ]);

    api.use([
        "jandres:template-extension@4.0.7-alpha3",
        'underscore',
        'templating',
        'jquery',
        'tracker',
        'reactive-var'
    ], 'client');

    // For some reason, 'modules' is not working here in test.
    api.addFiles([
        'tests/utils.js',
        'tests/utils/test-helpers.js',
        'tests/templates.html',

        'tests/scope.js',
        'tests/static-templates.js',
        'tests/dynamic-templates.js'
    ], 'client');
});