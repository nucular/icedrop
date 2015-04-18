"use strict";

if (typeof app == "undefined")
  var app = {};

app.SERVER = "http://vps.starcatcher.us:9001";

// Set up WebAudio, bind events and intervals
app.load = function() {
  app.mount = "";

  // Offscreen rendering
  app.offcanvas = document.createElement("canvas");
  app.offcanvas.width = app.canvas.width;
  app.offcanvas.height = app.canvas.height;
  app.offctx = app.offcanvas.getContext("2d");
  app.offctx.globalCompositeOperation = "lighter";
  
  // Initialize WebAudio
  app.context = new AudioContext();
  
  app.analyser = app.context.createAnalyser();
  app.analyser.fftSize = 1024;
  app.analyser.connect(app.context.destination);

  app.player = new Audio();
  app.player.crossOrigin = "anonymous";
  app.source = app.context.createMediaElementSource(app.player);
  app.source.connect(app.analyser);
  
  // Frequency- and time-domain data
  app.freqdata = new Uint8Array(app.analyser.frequencyBinCount);
  app.timedata = new Uint8Array(app.analyser.fftSize);
  
  // Update the hash
  setInterval(function() {
    var hmount = window.location.hash.substr(1);
    if (hmount == "" && app.mount != "")
      app.setMount();
    else if (app.mount != hmount)
      app.setMount(hmount);
  }, 300);

  // Update the metadata and station selection
  app.updateData();
  setInterval(app.updateData, 5000);

  // Hide the station selector
  $("#meta").on("click", function(e) {
    $("#stations").slideToggle();
  });
}

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

      $("#stations").slideUp();
      app.updateData();
    }
  } else {
    if (app.mount != "") {
      console.log("Switched station mount to none");

      app.mount = "";
      app.player.pause();

      $("#stations").slideDown();
      app.updateData();
    }
  }
}

// Request data from the Icecast API and update everything that uses it
app.updateData = function() {
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
          .appendTo("#stations")
          .on("click", function(e) {
            $(".station").removeClass("current");
            $(this).addClass("current");
          });
      }

      // Update station informations
      el.attr("href", "#" + mount);
      el.find(".station-name").text(v.server_name);
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
      app.setMount();
      updateData();
    } else if (current) {
      // Update current station informations
      $("#meta-listeners").text(current.listeners);
      $("#meta-title").text(current.title || "Unknown");
      $("#meta-artist").text(current.artist || "Unknown");
    }
  });
}

// Viewport has been resized
app.resize = function(w, h) {
  app.offcanvas.width = w;
  app.offcanvas.height = h;
}

// Get the current frequency- and time-domain data
app.update = function(dt) {
  app.analyser.getByteFrequencyData(app.freqdata);
  app.analyser.getByteTimeDomainData(app.timedata);
}

// Draw the visualization
app.draw = function() {
  var w = app.canvas.width, h = app.canvas.height;

  // Clear the offscreen canvas
  app.offctx.clearRect(0, 0, w, h);

  var fcount = app.analyser.frequencyBinCount;
  var tcount = app.analyser.fftSize;

  // Frequency average used for rotation later
  var avg = 0;

  for (var i = 0; i < fcount; i++) {
    var f = app.freqdata[i] / 255;
    var t = app.timedata[Math.floor((i / fcount) * tcount)] / 255;

    if (i < fcount / 2)
      avg += f * f;
    else
      avg -= f * f;
    
    // Draw the 
    app.offctx.fillStyle = "hsl(" + (48+(f * 164)) + ", 100%, " + (t * 100) + "%)";
    app.offctx.fillRect((i / fcount) * w, h - (f * h), w / fcount, f * (h / 5));
    app.offctx.fillRect(w - (i / fcount) * w, f * h, w / fcount, -f * (h / 5));
  }

  // Translate the contents of the screen, leave behind a trail
  app.ctx.save();
  app.ctx.translate(w/2, h/2);
  app.ctx.rotate((avg / (fcount / 2)) / 70);
  app.ctx.scale(0.99, 0.99);
  app.ctx.translate(-w/2, -h/2);

  app.ctx.drawImage(app.canvas, 0, 0);
  app.ctx.restore();

  // Draw the off-screen canvas untranslated to the screen
  app.ctx.drawImage(app.offcanvas, 0, 0);
}
