Package.describe({
    name: "meteoric124:template-scope",
    summary: "Replication of the angular's $scope mechanism.",
    version: "0.1.0-beta.4",
    git: "https://github.com/meteoric124/meteor-template-scope.git"
});

Package.onUse(function(api) {
    api.versionsFrom("1.3.2.4");

    api.use([
        "jandres:template-extension@4.0.7-alpha3",
        'underscore',
        'templating',
        'jquery',
        'ecmascript'
    ], 'client');

    api.addFiles([
        'lib/lib.js',
        'lib/data-polyfill.js',
        'lib/scope.js',
        'lib/scope-polyfill.js'
    ], 'client');

    api.export('$Scope');
    api.export('$rootScope');
});

Package.onTest(function(api) {
    api.use('jandres:template-scope');
    api.use([
        'sanjo:jasmine@1.0.1',
        'velocity:html-reporter'
    ]);

    api.use([
        "jandres:template-extension@4.0.7-alpha3",
        'underscore',
        'templating',
        'jquery',
        'ecmascript',
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