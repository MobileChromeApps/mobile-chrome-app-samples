/**
 * Listens for the app launching then creates the window.
 * Ignores the provided window size.
 *
 * @see http://developer.chrome.com/trunk/apps/app.window.html
 */
chrome.app.runtime.onLaunched.addListener(function() {
  chrome.app.window.create('build.html', {
    width: 244,
    height: 380,
  });
});
document.addEventListener('readystatechange', function(e) {
  console.log('Ready state fired.');
}, false);
