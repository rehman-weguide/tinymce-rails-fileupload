(function() {
  tinymce.PluginManager.add('uploadfile', function(editor, url) {
    var form, iframe, win;

    function showDialog() {
      win = editor.windowManager.open({
        title: 'Insert a file from your computer',
        size: 'normal',
        body: {
          type: 'panel',
          items: [
            {type: 'iframe', name: 'iframe', flex: true},
            {type: 'input', name: 'document[file]', label: 'Choose a file', inputMode: 'file'},
            {type: 'input', name: 'document[title]', label: 'Title'},
            {type: 'container', classes: 'error', html: "<p style='color: #b94a48;'>&nbsp;</p>"}
          ]
        },
        buttons: [
          {
            text: 'Insert',
            type: 'submit',
            primary: true,
            name: 'insert'
          },
          {
            text: 'Cancel',
            type: 'cancel'
          }
        ],
        onSubmit: function(api) {
          insertFile();
          api.close();
        }
      });

      iframe = win.find('iframe')[0];
      form = createElement('form', {
        action: editor.getParam("uploadfile_form_url", "/tinymce_assets"),
        target: iframe.name,
        method: "POST",
        enctype: 'multipart/form-data',
        accept_charset: "UTF-8",
      });

      iframe.getEl().name = iframe.name;

      form.appendChild(createElement('input', {type: "hidden", name: "utf8", value: "✓"}));
      form.appendChild(createElement('input', {type: 'hidden', name: 'authenticity_token', value: getMetaContents('csrf-token')}));

      var el = win.getEl();
      var body = document.getElementById(el.id + "-body");

      var containers = body.getElementsByClassName('tox-form__controls-h-stack');
      for (var i = 0; i < containers.length; i++) {
        form.appendChild(containers[i]);
      }

      var inputs = form.getElementsByTagName('input');
      for (var i = 0; i < inputs.length; i++) {
        var ctrl = inputs[i];
        if (ctrl.tagName.toLowerCase() == 'input' && ctrl.type != "hidden") {
          if (ctrl.type == "file") {
            ctrl.name = "document[file]";
            var padding = '0';
            if (window.navigator.userAgent.match(/(Chrome|Safari)/))
              padding = '7px 0';
            tinymce.DOM.setStyles(ctrl, {
              'border': 0,
              'boxShadow': 'none',
              'webkitBoxShadow': 'none',
              'padding': padding
            });
          } else if (ctrl.type == "text") {
            ctrl.name = "document[title]";
          }
        }
      }

      body.appendChild(form);
    }

    function insertFile() {
      if (getInputValue("document[file]") == "") {
        return handleError('You must choose a file');
      }

      clearErrors();

      var target = iframe.getEl();
      if (target.attachEvent) {
        target.detachEvent('onload', uploadDone);
        target.attachEvent('onload', uploadDone);
      } else {
        target.removeEventListener('load', uploadDone);
        target.addEventListener('load', uploadDone, false);
      }

      form.submit();
    }

    function uploadDone() {
      var target = iframe.getEl();
      if (target.document || target.contentDocument) {
        var doc = target.contentDocument || target.contentWindow.document;
        handleResponse(doc.getElementsByTagName("body")[0].innerHTML);
      } else {
        handleError("Did not get a response from the server");
      }
    }

    function handleResponse(ret) {
      try {
        var json = JSON.parse(ret);
        if (json["error"]) {
          handleError(json["error"]["message"]);
        } else {
          editor.insertContent(buildHTML(json));
        }
      } catch (e) {
        console.log(e);
        handleError('Got a bad response from the server');
      }
    }

    function clearErrors() {
      var message = win.find(".error")[0].getEl();
      if (message)
        message.getElementsByTagName("p")[0].innerHTML = "&nbsp;";
    }

    function handleError(error) {
      var message = win.find(".error")[0].getEl();
      if (message)
        message.getElementsByTagName("p")[0].innerHTML = editor.translate(error);
    }

    function createElement(element, attributes) {
      var el = document.createElement(element);
      for (var property in attributes) {
        if (!(attributes[property] instanceof Function)) {
          el[property] = attributes[property];
        }
      }
      return el;
    }

    function buildHTML(json) {
      var url = json["document"]["url"];
      var title = json["document"]["title"];
      var link = '<a href="' + url + '" title="' + title + '">' + title + '</a>';
      return link;
    }

    function getInputValue(name) {
      var inputs = form.getElementsByTagName("input");
      for (var i in inputs)
        if (inputs[i].name == name)
          return inputs[i].value;
      return "";
    }

    function getMetaContents(mn) {
      var m = document.getElementsByTagName('meta');
      for (var i in m)
        if (m[i].name == mn)
          return m[i].content;
      return null;
    }

    editor.ui.registry.addButton('uploadfile', {
      tooltip: 'Insert a file from your computer',
      icon: 'new-document',
      onAction: function() {
        showDialog();
      }
    });

    editor.ui.registry.addMenuItem('uploadfile', {
      text: 'Insert a file from your computer',
      icon: 'new-document',
      context: 'insert',
      onAction: function() {
        showDialog();
      }
    });

    return {
      getMetadata: function () {
        return {
          name: "Upload File Plugin",
          url: "https://www.example.com"
        };
      }
    };
  });
})();
