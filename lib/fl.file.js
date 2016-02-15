angular.module("fl.file", ["ngFileUpload"]).factory("NFileUploader", ['Upload', '$log', function NFileUploader(Upload, $log) {
  var options = {
    debug: false,
    token: 'myjhTmNj6KtZqX468hdRX2W5gWfygEGvf5',
    url: "https://nfile.niceilm.net/u"
  };

  return {
    uploads: uploads,
    setToken: setToken,
    setUrl: setUrl,
    setDebug: setDebug,
    setOptions: setOptions
  };

  function setToken(newToken) {
    options.token = newToken || options.token;
    return this;
  }

  function setDebug(newDebug) {
    options.debug = newDebug;
    return this;
  }

  function setUrl(newUrl) {
    options.url = newUrl || options.url;
    return this;
  }

  function setOptions(newOptions) {
    newOptions = newOptions || {};
    options = angular.extend(options, newOptions);
    return this;
  }

  function uploads(files) {
    if(options.debug) {
      $log.debug("upload start");
    }
    return Upload.upload({
      url: options.url,
      data: {files: files},
      headers: {
        "X-NFILE-TOKEN": options.token
      }
    }).then(function(resp) {
      if(options.debug) {
        $log.debug(arguments);
      }
      return resp.data.files;
    }, function(resp) {
      if(options.debug) {
        $log.error(resp);
      }
    }, function(evt) {
      if(options.debug) {
        var progressPercentage = parseInt(100.0 * evt.loaded / evt.total, 10);
        $log.debug('progress: ' + progressPercentage + '%');
      }
      return evt;
    }).finally(function() {
      if(options.debug) {
        $log.debug("upload complete");
      }
    });
  }
}]);