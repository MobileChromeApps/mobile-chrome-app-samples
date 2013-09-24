function logEvent(text) {
  var logLine = document.createElement('li');
  logLine.innerHTML = text;
  document.querySelector("#logs ul").appendChild(logLine);
  console.log(text);
}

function startServer() {
  logEvent("Starting web server");
  chrome.socket.create('tcp', function(createInfo) {
    logEvent("Socket created: " + createInfo.socketId);
    chrome.socket.listen(createInfo.socketId, '0.0.0.0', 8081, function(result) {
      if (result == 0) {
        listenForConnectionAndDispatchHttpReceiver(createInfo.socketId);
      } else {
        logEvent("Error on socket.listen: " + result);
      }
    });
  });
}

function listenForConnectionAndDispatchHttpReceiver(socketId) {
  logEvent("Socket listening");
  chrome.socket.accept(socketId, function(acceptInfo) {
    logEvent("Connection established on socket " + acceptInfo.socketId);
    requests[acceptInfo.socketId] = {state: "new", data: ""};
    receiveHttpData(acceptInfo.socketId);
    listenForConnectionAndDispatchHttpReceiver(socketId);
  });
};

var requests = {}

function receiveHttpData(socketId) {
  chrome.socket.read(socketId, function(readInfo) {
    var newData = "";
    var rawData = new Uint8Array(readInfo.data);
    for (var i=0; i < readInfo.data.byteLength; i++) {
      newData += String.fromCharCode(rawData[i]); // unicode
    }
    requests[socketId].data += newData;
    if (!processHttpRequest(socketId)) {
      receiveHttpData(socketId);
    }
  });
}

function processHttpRequest(socketId) {
  var request = requests[socketId];
  switch (request.state) {
    case "new":
      var splitPoint = request.data.indexOf("\r\n");
      if (splitPoint > -1) {
        request.requestLine = request.data.substring(0, splitPoint);
        request.data = request.data.substring(splitPoint);
        var requestParts = request.requestLine.split(' ');
        request.method = requestParts[0].toUpperCase();
        request.resource = requestParts[1];
        request.httpVersion = requestParts[2];
        logEvent(request.method + " request received for " + request.resource);
        request.state = "requestReceived";
        return processHttpRequest(socketId);
      }
      return false;
    case "requestReceived":
      var splitPoint = request.data.indexOf("\r\n\r\n");
      if (splitPoint > -1) {
        request.headers = request.data.substring(0, splitPoint);
        request.data = request.data.substring(splitPoint);
        if (request.method === "GET") {
          serveResource(socketId);
          request.state = "responseSent";
          return true;
        }
        request.state = "headersReceived";
        return processHttpRequest(socketId);
      }
      return false;
    case "headersReceived":
      break;
  }
}

function serveResource(socketId) {
  var request = requests[socketId];
  var urlParts = request.resource.split("?");
  var localPart = urlParts[0];
  var localParts = localPart.split("/");
  if (localParts.shift() !== "") {
    return serveError(socketId, 400, "Bad Request");
  }
  var isDirRequest = false;
  if (localParts[localParts.length-1] == "") {
    isDirRequest = true;
    localParts.pop();
  }
  if (localParts.length === 0) {
    return serveIndex(socketId);
  }
  switch (localParts.shift()) {
    case "asset":
      return serveAsset(socketId, localParts, isDirRequest);
    case "file":
      return serveFile(socketId, localParts, isDirRequest);
  }
  return serveError(socketId, 404, "Not Found");

}

function normalizePath(localParts) {
  for (var i=0; i < localParts.length; i++) {
    if (localParts[i] == "..") {
      if (i === 0) return false;
      localParts.splice(i-1,2);
      i -= 2;
    }
    else if (localParts[i] == ".") {
      localParts.splice(i,1);
      i -= 1;
    }
  }
  return localParts;
}

function serveAsset(socketId, localParts, isDirRequest) {
  localParts = normalizePath(localParts);
  if (localParts === false) return false;
  if (isDirRequest) localParts.push("index.html");
  var fileName = "/htdocs/" + localParts.join("/");
  logEvent(fileName);
  var xhr = new XMLHttpRequest();
  xhr.open('GET', fileName);
  xhr.responseType = 'arraybuffer';
  xhr.onload = function(ev) {
    logEvent("Asset read; returning");
    var header = ["HTTP/1.1 200 OK",
                  "Connection: close",
                  "Content-Type: text/html",
                  "Content-Length: " + xhr.response.byteLength,
                  "",""].join("\r\n");
    var buffer = new ArrayBuffer(header.length);
    var bufferView = new Uint8Array(buffer);
    for (var i=0; i < header.length; i++) bufferView[i] = header.charCodeAt(i); // unicode
    chrome.socket.write(socketId, buffer, function(writeInfo) {
      logEvent("Going to write file data");
      logEvent(xhr.response);
      logEvent(typeof xhr.response);
      logEvent(xhr.response.byteLength);
      chrome.socket.write(socketId, xhr.response, function(writeInfo) {
        logEvent("disconnecting");
        chrome.socket.disconnect(socketId);
      });
    });
  };
  xhr.onerror = function(ev) {
    logEvent("not found");
    serveError(socketId, 404, "Not Found");
  };
  xhr.send();
}

function serveFile(socketId, localParts, isDirRequest) {
  localParts = normalizePath(localParts);
  if (localParts === false) return false;
  if (isDirRequest) localParts.push("index.html");
  var fileName = localParts.join("/");
  if (window.webkitStorageInfo) {
    window.webkitStorageInfo.requestQuota(window.PERSISTENT,1048576);
  }
  (window.requestFileSystem || window.webkitRequestFileSystem)(window.PERSISTENT || window.LocalFileSystem.PERSISTENT, 0, function(fs) {
    (window.resolveLocalFileSystemURL || window.resolveLocalFileSystemURI || window.webkitResolveLocalFileSystemURL)(fs.root.toURL() + "/htdocs/" + fileName, function(entry) {
      entry.file(function(fileObject) {
        var reader = new FileReader();
logEvent('1');
        reader.onloadend = function (ev) {
logEvent('2');
          var header = ["HTTP/1.1 200 OK",
                        "Connection: close",
                        "Content-Type: text/html",
                        "Content-Length: " + reader.result.byteLength,
                        "",""].join("\r\n");
          var buffer = new ArrayBuffer(header.length);
          var bufferView = new Uint8Array(buffer);
          for (var i=0; i < header.length; i++) bufferView[i] = header.charCodeAt(i); // unicode
logEvent('3');
          chrome.socket.write(socketId, buffer, function(writeInfo) {
logEvent('4');
            chrome.socket.write(socketId, reader.result, function(writeInfo) {
logEvent('5');
              chrome.socket.disconnect(socketId);
            });
          });
        };
        reader.readAsArrayBuffer(fileObject);
      },
      function() {
        serveError(socketId, 500, "Internal Server Error");
      });
    },
    function() {
      serveError(socketId, 404, "Not Found");
    });
  },
  function() {
    serveError(socketId, 500, "Internal Server Error");
  });
}

function serveError(socketId, errno, errmsg) {
  logEvent("Error: " + errno);
  var data = ["HTTP/1.1 " + errno + " " + errmsg,
              "Connection: close",
              "Content-Type: text/plain",
              "Content-Length: " + errmsg.length,
              "",
              errmsg].join("\r\n");
  return serveHttpResponse(socketId, data);
}

function serveIndex(socketId) {
  var doc = ["<!DOCTYPE html>",
             "<head><title>Chrome App Web Server</title></head>",
             "<body>",
             "<h1>Sources</h1>",
             "<ul>",
             "<li><a href=\"/asset/\">/asset/</a></li>",
             "<li><a href=\"/file/\">/file/</a></li>",
             "</ul>",
             "</body>",
             "</html>"].join("\r\n");
  var data = ["HTTP/1.1 200 OK",
              "Connection: close",
              "Content-Type: text/html",
              "Content-Length: " + doc.length,
              "",
              doc].join("\r\n");
  return serveHttpResponse(socketId, data);
}

function serveHttpResponse(socketId, data) {
  logEvent("Returning response");
  var buffer = new ArrayBuffer(data.length);
  var bufferView = new Uint8Array(buffer);
  for (var i=0; i < data.length; i++) bufferView[i] = data.charCodeAt(i); // unicode
  chrome.socket.write(socketId, buffer, function(writeInfo) {
    chrome.socket.disconnect(socketId);
  });
}

window.onload = startServer;
