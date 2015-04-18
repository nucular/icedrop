if (typeof app == "undefined")
  var app = {};

app.SERVER = "http://vps.starcatcher.us:9001";
app.FPS = 60;

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
  
  app.freqdata = new Uint8Array(app.analyser.frequencyBinCount);
  app.timedata = new Uint8Array(app.analyser.fftSize);

  app.rotation = 0;
  
  app.setMount("/stream.ogg");
  setInterval(function() {
    if (app.mount)
      app.updateMeta();
    else
      app.updateStationSelect();
  }, 5000);
}

app.setMount = function(mount) {
  if (mount) {
    $("#stationselect").hide();
    $("#meta").show();
    
    if (app.source)
      app.source.disconnect();
    app.mount = mount;
  
    app.player = new Audio(app.SERVER + mount);
    app.player.crossOrigin = "anonymous";
  
    $(app.player).bind("canplay", function() {
      app.source = app.context.createMediaElementSource(app.player);
      app.source.connect(app.analyser);
      app.player.play();
    });
  
    app.updateMeta();
  } else {
    $("#stationselect").show();
    $("#meta").hide();
    
    app.updateStationSelect()
  }
}

app.updateMeta = function() {
  $.getJSON(app.SERVER + "/status-json.xsl", function(data) {
    var station;
    $.each(data.icestats.source, function(i, v) {
      if (v.listenurl == app.SERVER + app.mount)
        station = v;
    });
    
    if (!station) {
      // station disconnected?
      app.setMount();
      return;
    }
    
    $("#meta-listeners").text(station.listeners);
    $("#meta-title").text(station.title || "Unknown");
    $("#meta-artist").text(station.artist || "Unknown");
  });
}

app.updateStationSelect = function() {
  $.getJSON(app.SERVER + "/status-json.xsl", function(data) {
    //
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
