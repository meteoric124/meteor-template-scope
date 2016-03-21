/**
 * Use this function in your test if you need to wait for a DOM element.
 * @param selector
 * @param successCallback
 */
function waitForElement(selector, successCallback) {
    var checkInterval = 50;
    var timeoutInterval = jasmine.DEFAULT_TIMEOUT_INTERVAL;
    var startTime = Date.now();
    var intervalId = Meteor.setInterval(function () {
        if (Date.now() > startTime + timeoutInterval) {
            Meteor.clearInterval(intervalId);
            // Jasmine will handle the test timeout error
        } else if ($(selector).length > 0) {
            Meteor.clearInterval(intervalId);
            successCallback();
        }
    }, checkInterval);
}