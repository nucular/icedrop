(function() {
  "use strict";

  var app = window.app || {};
  window.app = app;

  // Keep the contexts separate
  function Preset(base) {
    this.load = base.load;
    this.draw = base.draw;
    this.resize = base.resize;
  }

  app.Preset = Preset;

  app.presets = {
    deflt: new Preset({
      load: function() {
        app.offctx.globalCompositeOperation = "lighter";
      },
      draw: function(w, h) {
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

          // Draw the rectangle
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
    }),

    ristovski: new Preset({
      load: function() {
        app.offctx.globalCompositeOperation = "lighter";
      },
      draw: function(w, h) {
        app.offctx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        for (var i = 0; i < fcount; i++) {
          var f = app.freqdata[i] / 255;
          var t = app.timedata[Math.floor((i / fcount) * tcount)] / 255;

          app.offctx.fillStyle = "hsl(" + (360-Math.exp(f * 9)) + ", 100%," + (t * 100) + "%)";
          app.offctx.fillRect((i / fcount) * w, h - (f * (h)), w / fcount, f * (h / 40));


          app.offctx.fillRect(w - (i / fcount) * w, f * (h), w / fcount, -f * (h / 40));
          app.offctx.fillRect(w - (i / fcount) / w, f * (h), w / fcount, -f * (h / 40));

        }

        app.ctx.save();
        app.ctx.translate(w/2, h/2);
        app.ctx.scale(0.98, 0.98);
        app.ctx.translate(-w/2, -h/2);
        app.ctx.drawImage(app.canvas, 0, 0);
        app.ctx.restore();

        app.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        app.ctx.fillRect(0, 0, w, h);

        app.ctx.drawImage(app.offcanvas, 0, 0);
      }
    }),

    simple: new Preset({
      draw: function(w, h) {
        app.ctx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        app.ctx.strokeStyle = "#fff";
        app.ctx.beginPath();
        app.ctx.moveTo(0, h / 2);
        for (var i = 0; i < tcount; i++) {
          var f = app.timedata[i] / 255;

          app.ctx.lineTo((i / tcount) * w, f * h);
        }
        app.ctx.stroke();
      }
    })
  };


})();
