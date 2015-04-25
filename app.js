(function() {
  "use strict";

  var base = window.base || {};
  var app = window.app || {};
  var api = window.api || {};

  app.SERVER = "http://vps.starcatcher.us:9001";

  // Set up WebAudio, bind events and intervals
  app.load = function() {
    app.mount = "";
    app.effect = {};

    // Initialize WebAudio
    app.context = new AudioContext();

    app.analyser = app.context.createAnalyser();
    app.analyser.fftSize = 1024;
    app.analyser.connect(app.context.destination);

    app.player = new Audio();
    app.player.crossOrigin = "anonymous";
    app.source = app.context.createMediaElementSource(app.player);
    app.source.connect(app.analyser);

    // Update the hash
    app.updateHash();
    setInterval(app.updateHash, 300);

    // Update the metadata and station selection
    app.updateData();
    setInterval(app.updateData, 5000);

    // Load a random effect
    api.load();
    app.loadEffect();

    // Toggle the station selector
    $("#meta").on("click", app.toggleMenu);
    $("#screen").on("click", function() {
      app.toggleMenu(false);
    });
  };

  // Set the station mount if the hash was modified
  app.updateHash = function() {
    var hmount = window.location.hash.substr(1);

    if (hmount == "" && app.mount != "")
      app.setMount();
    else if (app.mount != hmount)
      app.setMount(hmount);
  };

  // Show or hide the menu with the effect and station selectors
  app.toggleMenu = function(state) {
    if (state != false && state != true) {
      state = !$("#stations").is(":visible");
    }
    if (state) {
      $("#stations").focus();
      $({
        "alpha": 0,
        "width": $("#meta-inner").width() + 10
      }).animate({
        "alpha": 1,
        "width": 600
      }, {
        step: function() {
          $("#meta").css({
            "border-color": "rgba(255,255,255," + this.alpha + ")",
            "width": this.width
          });
        },
        complete: function() {
          $("#meta").css({
            "border-color": "rgba(255,255,255,1)",
            "width": 600
          });
          $("#menu").slideDown();
        }
      });

    } else {
      $("#stations").blur();
      $("#menu").slideUp(function() {
        $("#meta").animateAuto("width", function() {
          $(this).css("width", "auto");
        });
        $({
          "alpha": 1,
        }).animate({
          "alpha": 0,
        }, {
          step: function() {
            $("#meta").css({
              "border-color": "rgba(255,255,255," + this.alpha + ")",
            });
          },
          complete: function() {
            $("#meta").css("border-color", "rgba(255,255,255,0)");
          }
        });
      });
    }
  }

  // Load a effect from an object
  app.loadEffect = function(obj) {
    if (app.effect && app.effect.unload)
      app.effect.unload();

    if (!obj) {
      var n = chooseProperty(app.effects);
      obj = app.effects[n];
    }
    
    app.effect = obj;
    base.time = 0;

    if (obj.hasOwnProperty("renderer") && obj.renderer)
      api.setRenderer(obj.renderer);
    else
      api.setRenderer("2d")

    // Set up a "GLSL Sandbox"-like pipeline if requested
    if (obj.hasOwnProperty("shaders") && (api.renderer == "webgl" || api.renderer == "experimental-webgl")) {
      var buffer = api.gl.createBuffer();
      api.gl.bindBuffer(api.gl.ARRAY_BUFFER, buffer);
      api.gl.bufferData(api.gl.ARRAY_BUFFER, new Float32Array( [ - 1.0, - 1.0, 1.0, - 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0, 1.0, - 1.0, 1.0 ] ), api.gl.STATIC_DRAW);

      var fragment = api.gl.createShader(api.gl.FRAGMENT_SHADER);
      api.gl.shaderSource(fragment, obj.shaders.fragment ||
        "precision mediump float;\n" +
        "uniform float time;\n" +
        "uniform vec2 resolution;\n" +
        "void main(void) {\n" +
        "  gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n" +
        "}");
      api.gl.compileShader(fragment);

      var vertex = api.gl.createShader(api.gl.VERTEX_SHADER);
      api.gl.shaderSource(vertex, obj.shaders.vertex ||
        "attribute vec3 position;\n" +
        "void main(void) {\n" +
        "  gl_Position = vec4(position, 1.0);\n" +
        "}");
      api.gl.compileShader(vertex);

      api.gl.program = api.gl.createProgram();
      api.gl.attachShader(api.gl.program, fragment);
      api.gl.attachShader(api.gl.program, vertex);
      api.gl.deleteShader(fragment);
      api.gl.deleteShader(vertex);
      api.gl.linkProgram(api.gl.program);
      api.gl.useProgram(api.gl.program);

      api.gl.program.positionLocation = api.gl.getAttribLocation(api.gl.program, "position");
      api.gl.enableVertexAttribArray(api.gl.program.positionLocation);
      api.gl.program.timeLocation = api.gl.getUniformLocation(api.gl.program, "time");
      api.gl.program.mouseLocation = api.gl.getUniformLocation(api.gl.program, "mouse");
      api.gl.program.resolutionLocation = api.gl.getUniformLocation(api.gl.program, "resolution");

      if (!obj.draw) {
        obj.draw = function(w, h, s) {
          api.gl.uniform2f(api.gl.program.resolutionLocation, w, h);
          api.gl.vertexAttribPointer(api.gl.program.positionLocation, 2, api.gl.FLOAT, false, 0, 0);

          api.gl.clear(api.gl.COLOR_BUFFER_BIT | api.gl.DEPTH_BUFFER_BIT);
          api.gl.drawArrays(api.gl.TRIANGLES, 0, 6);
        }
      }

      if (!obj.update) {
        obj.update = function(dt, time) {
          api.gl.uniform1f(api.gl.program.timeLocation, time);
          api.gl.uniform2f(api.gl.program.mouseLocation,
            base.mouse.x / base.canvas.width,
            -base.mouse.y / base.canvas.height);
        }
      }
    }

    if (obj.hasOwnProperty("load") && obj.load)
      obj.load();
  };

  // Load a effect from a JSON string
  app.loadEffectFromJSON = function(json) {
    var obj;
    try {
      obj = JSON.parse(json, function (k, v) {
        if (v
            && typeof v === "string"
            && v.substr(0,8) == "function") {
            var startBody = v.indexOf('{') + 1;
            var endBody = v.lastIndexOf('}');
            var startArgs = v.indexOf('(') + 1;
            var endArgs = v.indexOf(')');

            return new Function(v.substring(startArgs, endArgs),
              v.substring(startBody, endBody));
        }
        return v;
      });
    } catch (e) {
      console.error("Error while parsing effect JSON", e);
      return false;
    }
    app.loadEffect(new app.effect(obj));
    return true;
  };

  // Load a effect from a Icecast description string
  app.loadEffectFromDescription = function(desc, failcb) {
    var m = desc.match(/icedrop:(.+|\n+)/m);
    if (!m) {
      failcb();
      return;
    }
    m = m[1];

    if (m.match(/^\w+$/)) {
      // Load effect by name
      console.log("Station requested loading effect by name:", m);
      if (app.effects.hasOwnProperty(m))
        app.loadEffect(app.effects[m]);
      else
        failcb();
    } else if (m.match(/^(?:https?:\/\/)?(?:[\w]+\.)(?:\.?[\w]{2,})+$/)) {
      // Load effect from URL
      console.log("Station requested loading effect from URL:", m);
      $.get(m, function(data) {
        if (!app.loadEffectFromJSON(data))
          failcb();
      }, failcb);
    } else {
      // Load effect from direct JSON
      console.log("Station requested loading effect from JSON:", m);
      if (!app.loadEffectFromJSON(m))
        failcb();
    }
  };

  // Set the current station by mount point
  app.setMount = function(mount) {
    if (mount) {
      if (app.mount != mount) {
        console.log("Switched station mount to", mount);

        app.mount = mount;
        // Load the new stream
        app.player.setAttribute("src", app.SERVER + "/" + mount);
        app.player.load();
        app.player.play();

        // Update the hash
        var hmount = window.location.hash.substr(1);
        if (hmount != mount)
          window.location.hash = "#" + mount;

        app.toggleMenu(false);

        // Try to load a effect if existant
        app.updateData(function(station, data) {
          if (station && station.hasOwnProperty("server_description")) {
            var success = app.loadEffectFromDescription(station.server_description,
              function() {
                // Error or not even requested, load random effect instead
                app.loadEffect(app.effects["rose"]);
              });
          }
        });
      }
    } else {
      if (app.mount != "") {
        console.log("Switched station mount to none");

        app.mount = "";
        app.player.pause();

        // Update the hash
        var hmount = window.location.hash.substr(1);
        if (hmount != "")
          window.location.hash = "";

        app.toggleMenu(true);
        app.updateData();
      }
    }
  };

  // Request data from the Icecast API and update everything that uses it
  // The current station and the full data will be passed to the callback
  app.updateData = function(cb) {
    $.getJSON(app.SERVER + "/status-json.xsl", function(data) {
      var current, ids = [];

      $.each(data.icestats.source, function(i, v) {
        var mount = v.listenurl.match(/\/([^\/]+)$/)[1];
        var id = mount.replace(/[^\w]/g, "");

        ids.push(id);

        // Find existing station element or create it
        var el = $(".station#" + id);
        if (el.length == 0) {
          // Clone the template element
          el = $(".station#template")
            .clone()
            .attr("id", id)
            .appendTo("#stations").hide().fadeIn()
            .on("click", function(e) {
              $(".station").removeClass("current");
              $(this).addClass("current");
            });
        }

        // Update station informations
        el.attr("href", "#" + mount);
        el.find(".station-name").text(v.server_name || ("/" + mount));
        el.find(".station-listeners").text(v.listeners);
        el.find(".station-title").text(v.title || "Unknown");
        el.find(".station-artist").text(v.artist || "Unknown");

        // Found the station that is currently being listened to
        if (mount == app.mount) {
          current = v;
          el.addClass("current");
        }
      });

      // Clean up stations that have gone offline since the last update
      $(".station").each(function(i, v) {
        var el = $(v);
        var id = el.attr("id");

        if (ids.indexOf(id) == -1 && id != "template") {
          el.fadeOut(function() {
            el.remove();
          });
        }
      });

      if (!current && app.mount != "") {
        // Station probably disconnected
        console.log("Current station disconnected");
        $(".station.current").fadeOut(function() {
          $(this).remove();
          app.updateData();
        });
        app.setMount();

      } else if (current) {
        // Update current station informations
        $("#meta-listeners").text(current.listeners);
        $("#meta-title").text(current.title || "Unknown");
        $("#meta-artist").text(current.artist || "Unknown");
      }

      if (cb)
        cb(current, data.icestats);
    });
  };

  // Viewport has been resized
  app.resize = function(w, h, ow, oh) {
    var r = true;
    if (app.effect && app.effect.resize) {
      r = app.effect.resize(w, h, ow, oh);
    }
    if (r == true || typeof r == "undefined") {
      api.canvas.width = w;
      api.canvas.height = h;
      api.ocanvas.width = w;
      api.ocanvas.height = h;

      if (api.gl && api.ogl) {
        api.gl.viewport(0, 0, w, h);
        api.ogl.viewport(0, 0, w, h);
      }
    }
  };

  // Get the current frequency- and time-domain data
  app.update = function(dt, time) {
    app.analyser.getByteFrequencyData(api.freqdata);
    app.analyser.getByteTimeDomainData(api.timedata);

    if (app.effect.update)
      app.effect.update(dt, time);
  };

  // Draw the visualization
  app.draw = function() {
    var w = base.canvas.width, h = base.canvas.height;
    var s = Math.min(w, h);
    if (app.effect.draw)
      app.effect.draw(w, h, s);

    base.ctx.drawImage(api.canvas, 0, 0, w, h);
  };

  window.app = app;
})();
