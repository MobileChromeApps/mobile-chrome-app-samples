/**
 * Listens for the app launching then creates the window.
 * Ignores the provided window size.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */

var version="0.1.6";

var events = [];

function log(string) {
    var d = new Date;
    console.log("" + d.getSeconds() + "." + d.getMilliseconds() + " " + version + ": " + string);
    events.push(version + ": " + string);
}

log("Application Started");

chrome.app.runtime.onLaunched.addListener(function(launchData) {
  log("launched");
  if (launchData) {
    log("ID: " + launchData.id);
  }
  chrome.app.window.create('index.html', {
    width: 244,
    height: 380,
  });
});

chrome.app.runtime.onRestarted.addListener(function() {
    log("restarted");
});

chrome.runtime.onStartup.addListener(function() {
    log("startup");
});

chrome.runtime.onInstalled.addListener(function(details) {
    log("installed");
    log("Reason: " + details.reason);
    if (details.previousVersion) {
        log("Previous version: " + details.previousVersion);
    }
});

chrome.runtime.onSuspend.addListener(function() {
    log("suspend");
});

chrome.runtime.onSuspendCanceled.addListener(function() {
    log("suspendCanceled");
});
