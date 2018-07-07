module.exports = function(config) {
    config.set({
        basePath: '../',
        frameworks: ['jasmine'],
        browsers: ['Chrome'],
        files: [
            "lib/angular.js",
            "lib/angular-animate.min.js",
            "lib/angular-aria.min.js",
            "lib/angular-messages.min.js",
            "lib/angular-material.js",
            "test/angular-mocks.js",
            "mb-calc.js",
            "test/*.spec.js",
        ]
    });
};