(function() {
  "use strict";

  var app = window.app || {};
  window.app = app;

  // Keep the contexts separate
  function Effect(base) {
    this.load = base.load;
    this.draw = base.draw;
    this.resize = base.resize;
  }

  app.Effect = Effect;

  app.effects = {
    deflt: new Effect({
      draw: function(w, h) {
        app.offctx.globalCompositeOperation = "lighter";

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
          app.offctx.fillRect((i / fcount) * w, h - (f * (h / 4)), w / fcount, f * (h / 4));
          app.offctx.fillRect(w - (i / fcount) * w, f * (h / 4), w / fcount, -f * (h / 4));
        }

        // Translate the contents of the screen, leave behind a trail
        app.ctx.save();
        app.ctx.translate(w/2, h/2);
        app.ctx.rotate((avg / (fcount / 2)) / 10);
        app.ctx.scale(0.99, 0.99);
        app.ctx.translate(-w/2, -h/2);

        app.ctx.drawImage(app.canvas, 0, 0);
        app.ctx.restore();

        // Draw the off-screen canvas untranslated to the screen
        app.ctx.drawImage(app.offcanvas, 0, 0);
      }
    }),

    ristovski: new Effect({
      draw: function(w, h) {
        app.offctx.globalCompositeOperation = "lighter";
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

    simple: new Effect({
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
    }),

    freq3d: new Effect({
      draw: function(w, h) {
        app.offctx.clearRect(0, 0, w, h);
        app.offctx.translate(w / 2, h / 2);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        var side = Math.sqrt(app.analyser.frequencyBinCount);
        var mfcount = Math.floor(fcount / side) * side;

        for (var i = 0; i < mfcount; i++) {
          var f = app.freqdata[i] / 255;
          var t = app.timedata[Math.floor((i / fcount) * tcount)] / 255;

          var x = (i % side) / side;
          var y = f;
          var z = 1 - (Math.floor(i / side) / side);
          var rw = (1.5 - z) * 5;

          // Translate a bit
          x = (x - 0.5) / 2;
          y = (y - 0.5) / 2 + (z / 4);
          z = (z + 0.5) * 2;

          // Project
          var px = (x * w) / z;
          var py = (-y * h) / z;

          app.offctx.fillStyle = "hsl(" + (48+(i/fcount * 164)) + ", 100%, " + (t * 100) + "%)";
          app.offctx.fillRect(px, py, rw, rw / 2);
        }

        app.offctx.translate(-w / 2, -h / 2);

        app.ctx.save();
        app.ctx.translate(w/2, h/2);
        app.ctx.scale(0.99, 0.99);
        app.ctx.translate(-w/2, -h/2);
        app.ctx.drawImage(app.canvas, 0, 0);
        app.ctx.restore();

        app.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        app.ctx.fillRect(0, 0, w, h);

        app.ctx.drawImage(app.offcanvas, 0, 0);
      }
    }),

    deadrose: new Effect({
      draw: function(w, h) {
        app.offctx.globalCompositeOperation = "lighter";
        var s = Math.min(w, h) / 2;
        app.offctx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        app.offctx.translate(w / 2, h / 2);
        var avg = 0;
        for (var i = 0; i < fcount; i++) {
          var f = app.freqdata[i] / 255;
          var t = app.timedata[Math.floor((i / fcount) * tcount)] / 255;

          if (i < fcount / 3)
            avg += f * f;
          else
            avg -= f * f;

          var x = Math.cos(i / fcount * 200) * f;
          var y = Math.sin(i / fcount * 200) * f;

          app.offctx.fillStyle = "hsla(" + (300+(i/fcount)*80) + ", 100%," + (t * 100) + "%, " + (f+0.6) + ")";
          app.offctx.fillRect(x * s, y * s,
            (0.1 + f) * (s / 60), (0.1 + f) * (s / 60));

        }
        app.offctx.translate(-w / 2, -h / 2);

        app.ctx.save();
        app.ctx.translate(w/2, h/2);
        app.ctx.rotate((avg / (fcount / 2)) / 10);
        app.ctx.scale(0.99, 0.99);
        app.ctx.translate(-w/2, -h/2);
        app.ctx.drawImage(app.canvas, 0, 0);
        app.ctx.restore();

        app.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        app.ctx.fillRect(0, 0, w, h);

        app.ctx.drawImage(app.offcanvas, 0, 0);
      }
    })
  };


})();
