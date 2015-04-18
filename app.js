if (typeof app == "undefined")
  var app = {};

app.SERVER = "http://vps.starcatcher.us:9001";

app.load = function() {
  app.fxcanvas = document.createElement("canvas");
  app.fxcanvas.width = app.canvas.width;
  app.fxcanvas.height = app.canvas.height;
  app.fxctx = app.fxcanvas.getContext("2d");
  app.fxctx.globalCompositeOperation = "lighter";
  
  app.context = new AudioContext();
  
  app.analyser = app.context.createAnalyser();
  app.analyser.fftSize = 1024;
  app.analyser.connect(app.context.destination);

  app.player = new Audio();
  app.player.crossOrigin = "anonymous";
  app.source = app.context.createMediaElementSource(app.player);
  app.source.connect(app.analyser);
  
  app.freqdata = new Uint8Array(app.analyser.frequencyBinCount);
  app.timedata = new Uint8Array(app.analyser.fftSize);

  app.rotation = 0;
  app.mount = "";
  
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

  $("#meta").on("click", function(e) {
    $("#stations").slideToggle();
  });
}

app.setMount = function(mount) {
  if (mount) {
    if (app.mount != mount) {
      app.mount = mount;
    
      app.player.setAttribute("src", app.SERVER + "/" + mount);
      app.player.load();
      app.player.play();

      $("#stations").slideUp();
      app.updateData();
    }
  } else {
    if (app.mount != "") {
      app.mount = "";
      app.player.pause();

      $("#stations").slideDown();
      app.updateData();
    }
  }
}

app.updateData = function() {
  $.getJSON(app.SERVER + "/status-json.xsl", function(data) {
    var current;

    var ids = [];

    $.each(data.icestats.source, function(i, v) {
      var mount = v.listenurl.match(/\/([^\/]+)$/)[1];
      var id = mount.replace(/[^\w]/g, "");
      ids.push(id);

      var el = $(".station#" + id);
      if (el.length == 0) {
        el = $(".station#template")
          .clone()
          .attr("id", id)
          .appendTo("#stations")
          .on("click", function(e) {
            $(".station").removeClass("current");
            $(this).addClass("current");
          });
      }
      el.attr("href", "#" + mount);
      el.find(".station-name").text(v.server_name);
      el.find(".station-listeners").text(v.listeners);
      el.find(".station-title").text(v.title || "Unknown");
      el.find(".station-artist").text(v.artist || "Unknown");

      if (mount == app.mount) {
        current = v;
        el.addClass("current");
      }
    });

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
      // station probably disconnected
      console.log("Station disconnected");
      app.setMount();
    } else if (current) {
      $("#meta-listeners").text(current.listeners);
      $("#meta-title").text(current.title || "Unknown");
      $("#meta-artist").text(current.artist || "Unknown");
    }
  });
}

app.resize = function(w, h) {
  app.fxcanvas.width = w;
  app.fxcanvas.height = h;
}

app.update = function(dt) {
  app.analyser.getByteFrequencyData(app.freqdata);
  app.analyser.getByteTimeDomainData(app.timedata);
}

app.draw = function(ctx, w, h, s) {
  app.fxctx.clearRect(0, 0, app.fxcanvas.width, app.fxcanvas.height);

  var fcount = app.analyser.frequencyBinCount;
  var tcount = app.analyser.fftSize;

  var avg = 0;
  for (var i = 0; i < fcount; i++) {
    var f = app.freqdata[i] / 255;
    var t = app.timedata[Math.floor((i / fcount) * tcount)] / 255;
    if (i < fcount / 2)
      avg += f * f;
    else
      avg -= f * f;
    
    app.fxctx.fillStyle = "hsl(" + (48+(f * 164)) + ", 100%, " + (t * 100) + "%)";
    app.fxctx.fillRect((i / fcount) * w, h - (f * h), w / fcount, f * (h / 5));
    app.fxctx.fillRect(w - (i / fcount) * w, f * h, w / fcount, -f * (h / 5));
  }
  app.rotation = (avg / (fcount / 2)) / 70;

  app.ctx.save();
  app.ctx.translate(w/2, h/2);
  app.ctx.rotate(app.rotation);
  app.ctx.scale(0.99, 0.99);
  app.ctx.translate(-w/2, -h/2);
  app.ctx.drawImage(app.canvas, 0, 0);
  app.ctx.restore();

  app.ctx.drawImage(app.fxcanvas, 0, 0);
}

app.mousemoved = function(x, y, dx, dy) {
}

app.mousepressed = function(b, x, y) {
}

app.mousereleased = function(b, x, y) {
}
