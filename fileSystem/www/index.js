var currentEntry;

function updateStatusBar() {
  var statusBar = document.getElementById('statusBar');
  if (chrome.runtime.lastError) {
    statusBar.innerHTML = chrome.runtime.lastError.message;
  } else {
    statusBar.innerHTML = '';
  }
}

var fileButton = document.getElementById("openFile");
fileButton.addEventListener('click', function() {
  chrome.fileSystem.chooseEntry({type: 'openFile', accepts: [
    {descriptfion:"Text Files", extensions: ['txt','text']},
    {descriptfion:"Images (don't open please)", mimeTypes: ['image/jpg','image/pong']}
    ], acceptsAllTypes: true}, function(f) {
    updateStatusBar();
    if (chrome.runtime.lastError) {
      console.log(chrome.runtime.lastError);
    }
    else {
      f.file(function(fileObject) {
        var reader = new FileReader();
        reader.onload = function(ev) {
          document.getElementById('contents').value = reader.result;
        };
        reader.readAsText(fileObject);
      })
      currentEntry = f;
    }
  });
});

var saveButton = document.getElementById("saveFile");
saveButton.addEventListener('click', function() {
  if (currentEntry) {
    saveCurrentEntry();
  } else {
    saveAs();
  }
});

var saveAsButton = document.getElementById("saveFileAs");
saveAsButton.addEventListener('click', function() {
  saveAs();
});

function saveCurrentEntry() {
  chrome.fileSystem.getWritableEntry(currentEntry, function(f) {
    updateStatusBar();
    f.createWriter(function(writer) {
      var text = document.getElementById('contents').value;
      writer.onerror = function(e) {
        console.log("Error");
        console.log(e);
      };
      writer.onwriteend = function(e) {
        console.log("WriteEnd");
        console.log(e);
      }
      writer.onwrite = function(e) {
        console.log("Write");
        console.log(e);
      }
      var blob = new Blob([text], {type: 'text/plain'});
      writer.write(blob);
    })
  });
}

function saveAs() {
  chrome.fileSystem.chooseEntry({type: 'saveFile'}, function(f) {
    console.log("File picked");
    updateStatusBar();
    if (!chrome.runtime.lastError) {
      currentEntry = f;
      saveCurrentEntry();
    }
  });
}

function checkWritable() {
  chrome.fileSystem.isWritableEntry(currentEntry, function(isWritable) {
    if (isWritable) {
      alert("It's writable");
    } else {
      alert("It's not writable!");
    }
  });
}