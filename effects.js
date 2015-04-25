(function() {
  "use strict";

  var app = window.app || {};
  window.app = app;

  // Keep the contexts separate
  function Effect(base) {
    this.name = base.name;
    this.author = base.author;

    this.load = base.load;
    this.draw = base.draw;
    this.resize = base.resize;

    this.renderer = base.renderer;
    this.shaders = base.shaders;
  }

  app.Effect = Effect;

  app.effects = {
    deflt: new Effect({
      name: "Default",
      author: "nucular",
      draw: function(w, h, s) {
        api.octx.globalCompositeOperation = "lighter";

        // Clear the offscreen canvas
        api.octx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        // Frequency average used for rotation later
        var avg = 0;

        for (var i = 0; i < fcount; i++) {
          var f = api.freqdata[i] / 255;
          var t = api.timedata[Math.floor((i / fcount) * tcount)] / 255;

          if (i < fcount / 2)
            avg += f * f;
          else
            avg -= f * f;

          // Draw the rectangle
          api.octx.fillStyle = "hsl(" + (48+(f * 164)) + ", 100%, " + (t * 100) + "%)";
          api.octx.fillRect((i / fcount) * w, h - (f * (h / 4)), w / fcount, f * (h / 4));
          api.octx.fillRect(w - (i / fcount) * w, f * (h / 4), w / fcount, -f * (h / 4));
        }

        // Translate the contents of the screen, leave behind a trail
        api.ctx.save();
        api.ctx.translate(w/2, h/2);
        api.ctx.rotate((avg / (fcount / 2)) / 10);
        api.ctx.scale(0.99, 0.99);
        api.ctx.translate(-w/2, -h/2);

        api.ctx.drawImage(api.canvas, 0, 0);
        api.ctx.restore();

        // Draw the off-screen canvas untranslated to the screen
        api.ctx.drawImage(api.ocanvas, 0, 0);
      }
    }),

    ristovski: new Effect({
      name: "Effect Jesus",
      author: "Ristovski (effect jesus)",
      draw: function(w, h, s) {
        api.octx.globalCompositeOperation = "lighter";
        api.octx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        for (var i = 0; i < fcount; i++) {
          var f = api.freqdata[i] / 255;
          var t = api.timedata[Math.floor((i / fcount) * tcount)] / 255;

          api.octx.fillStyle = "hsl(" + (360-Math.exp(f * 9)) + ", 100%," + (t * 100) + "%)";
          api.octx.fillRect((i / fcount) * w, h - (f * (h)), w / fcount, f * (h / 40));


          api.octx.fillRect(w - (i / fcount) * w, f * (h), w / fcount, -f * (h / 40));
          api.octx.fillRect(w - (i / fcount) / w, f * (h), w / fcount, -f * (h / 40));

        }

        api.ctx.save();
        api.ctx.translate(w/2, h/2);
        api.ctx.scale(0.98, 0.98);
        api.ctx.translate(-w/2, -h/2);
        api.ctx.drawImage(api.canvas, 0, 0);
        api.ctx.restore();

        api.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        api.ctx.fillRect(0, 0, w, h);

        api.ctx.drawImage(api.ocanvas, 0, 0);
      }
    }),

    simple: new Effect({
      name: "Simple",
      author: "nucular",
      draw: function(w, h, s) {
        api.ctx.clearRect(0, 0, w, h);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        api.ctx.strokeStyle = "#fff";
        api.ctx.beginPath();
        api.ctx.moveTo(0, h / 2);
        for (var i = 0; i < tcount; i++) {
          var f = api.timedata[i] / 255;

          api.ctx.lineTo((i / tcount) * w, f * h);
        }
        api.ctx.stroke();
      }
    }),

    freq3d: new Effect({
      name: "Freq3D",
      author: "nucular",
      draw: function(w, h, s) {
        api.octx.clearRect(0, 0, w, h);
        api.octx.translate(w / 2, h / 2);

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        var side = Math.sqrt(app.analyser.frequencyBinCount);
        var mfcount = Math.floor(fcount / side) * side;

        for (var i = 0; i < mfcount; i++) {
          var f = api.freqdata[i] / 255;
          var t = api.timedata[Math.floor((i / fcount) * tcount)] / 255;

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

          api.octx.fillStyle = "hsl(" + (48+(i/fcount * 164)) + ", 100%, " + (t * 100) + "%)";
          api.octx.fillRect(px, py, rw, rw / 2);
        }

        api.octx.translate(-w / 2, -h / 2);

        api.ctx.save();
        api.ctx.translate(w/2, h/2);
        api.ctx.scale(0.99, 0.99);
        api.ctx.translate(-w/2, -h/2);
        api.ctx.drawImage(api.canvas, 0, 0);
        api.ctx.restore();

        api.ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
        api.ctx.fillRect(0, 0, w, h);

        api.ctx.drawImage(api.ocanvas, 0, 0);
      }
    }),

    deadrose: new Effect({
      name: "Dead Rose",
      author: "nucular",
      draw: function(w, h, s) {
        api.octx.globalCompositeOperation = "lighter";
        api.octx.clearRect(0, 0, w, h);

        s = s / 2;

        var fcount = app.analyser.frequencyBinCount;
        var tcount = app.analyser.fftSize;

        api.octx.translate(w / 2, h / 2);
        var avg = 0;
        for (var i = 0; i < fcount; i++) {
          var f = api.freqdata[i] / 255;
          var t = api.timedata[Math.floor((i / fcount) * tcount)] / 255;

          if (i < fcount / 3)
            avg += f * f;
          else
            avg -= f * f;

          var x = Math.cos(i / fcount * 200) * f;
          var y = Math.sin(i / fcount * 200) * f;

          if (!(x == 0 && y == 0)) {
            api.octx.fillStyle = "hsla(" + (300+(i/fcount)*80) + ", 100%," + (t * 100) + "%, " + (f+0.6) + ")";
            api.octx.fillRect(x * s, y * s,
              (0.1 + f) * (s / 60), (0.1 + f) * (s / 60));
          }

        }
        api.octx.translate(-w / 2, -h / 2);

        api.ctx.save();
        api.ctx.translate(w/2, h/2);
        api.ctx.rotate((avg / (fcount / 2)) / 10);
        api.ctx.scale(0.99, 0.99);
        api.ctx.translate(-w/2, -h/2);
        api.ctx.drawImage(api.canvas, 0, 0);
        api.ctx.restore();

        api.ctx.fillStyle = 'rgba(0, 0, 0, 0.03)';
        api.ctx.fillRect(0, 0, w, h);

        api.ctx.drawImage(api.ocanvas, 0, 0);
      }
    }),

    gltest: new Effect({
      name: "GLTest",
      author: "nucular",
      renderer: "webgl",
      shaders: {
        fragment: "precision mediump float;"
          + "uniform float time;"
          + "uniform vec2 mouse;"
          + "uniform vec2 resolution;"
          + "uniform float avg;"
          + "void main(void) {"
          + "  vec2 position = (gl_FragCoord.xy / resolution.xy) + mouse / 4.0;"
          + "  float color = 0.0;"
          + "  float btime = (time * 5.0) + (avg * 100.0);"
          + "  color += sin(position.x * cos(btime / 15.0) * 80.0) + cos(position.y * cos(btime / 15.0) * 10.0);"
          + "  color += sin(position.y * sin(btime / 10.0) * 40.0) + cos(position.x * sin(btime / 25.0) * 40.0);"
          + "  color += sin(position.x * sin(btime / 5.0) * 10.0) + sin(position.y * sin(btime / 35.0) * 80.0);"
          + "  color *= sin(btime / 10.0) * 0.5;"
          + "  gl_FragColor = vec4(vec3(color, color * 0.5, sin(color + btime / 3.0) * 0.75), 1.0);"
          + "}"
      },
      load: function() {
        api.gl.program.avgLocation = api.gl.getUniformLocation(api.gl.program, "avg");
      },
      draw: function(w, h, ow, oh) {
        var fcount = app.analyser.frequencyBinCount;
        var avg = 0;
        for (var i = 0; i < fcount; i++) {
          var f = api.freqdata[i] / 255;
          if (i < fcount / 3)
            avg += f * f;
          else
            avg -= f * f;
        }
        avg /= fcount;

        api.gl.uniform1f(api.gl.program.avgLocation, avg);
        api.gl.uniform2f(api.gl.program.resolutionLocation, w, h);
        api.gl.vertexAttribPointer(api.gl.program.positionLocation, 2, api.gl.FLOAT, false, 0, 0);

        api.gl.clear(api.gl.COLOR_BUFFER_BIT | api.gl.DEPTH_BUFFER_BIT);
        api.gl.drawArrays(api.gl.TRIANGLES, 0, 6);
      }
    })
  };


})();
