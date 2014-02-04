// Initialize syncFileSystem.
function main() {
  var sfs;
  var requestFileSystemCallback = function(fileSystem) {
    sfs = fileSystem;
    loadFile();
  };
  chrome.syncFileSystem.requestFileSystem(requestFileSystemCallback);

  // Set the button listeners.
  var saveButton = document.getElementById('saveButton');
  saveButton.onclick = function() {
    var createWriterCallback = function(fileWriter) {
      var blob = new Blob([document.getElementById('textarea').value]);
      fileWriter.write(blob);
    };
    var getFileCallback = function(fileEntry) {
      fileEntry.createWriter(createWriterCallback);
    };
    sfs.root.getFile('syncFile.txt', { create: true }, getFileCallback);
  };

  var loadButton = document.getElementById('loadButton');
  var loadFile = function() {
    var fileCallback = function(file) {
      var fileReader = new FileReader();
      fileReader.readAsText(file, "utf-8");
      fileReader.onload = function(e) {
        document.getElementById('textarea').value = e.target.result;
      };
    };
    var getFileCallback = function(fileEntry) {
      fileEntry.file(fileCallback);
    };
    sfs.root.getFile('syncFile.txt', { create: false }, getFileCallback);
  };
  loadButton.onclick = loadFile;

  // Set the onChanged event.
  chrome.syncFileSystem.onFileStatusChanged.addListener(function(detail) {
    if (detail.direction === 'remote_to_local') {
      console.log('===== ' + JSON.stringify(detail));
      loadFile();
    }
  });
}
function main2() {
  chrome.runtime.setManifest({
    "incoming_sync_delay": { 'maximum': 2000 },
    "name": 'PGD_SyncDemo',
    "oauth2": {
      "client_id": "199533847999.apps.googleusercontent.com",
      "scopes": [
        "https://www.googleapis.com/auth/drive"
      ]
    }
  });
  main();
}
if (window.chrome && window.chrome.syncFileSystem) {
    main();
} else {
    document.addEventListener('deviceready', main2, false);
    var cdvScript = document.createElement('script');
    cdvScript.src = 'cordova.js';
    document.body.appendChild(cdvScript);
}
