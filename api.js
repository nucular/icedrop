(function() {
  "use strict";

  var base = window.base || {};
  var app = window.app || {};
  var api = window.api || {};

  api.load = function() {
    api.freqdata = new Uint8Array(app.analyser.frequencyBinCount);
    api.timedata = new Uint8Array(app.analyser.fftSize);

    api.mouse = base.mouse;
    api.setRenderer("2d");
  }

  api.setRenderer = function(ren) {
    if (api.renderer == ren) return;
    api.renderer = ren;

    // On-screen canvas
    api.canvas = document.createElement("canvas");
    api.canvas.width = base.canvas.width;
    api.canvas.height = base.canvas.height;

    // Off-screen canvas
    api.ocanvas = document.createElement("canvas");
    api.ocanvas.width = base.canvas.width;
    api.ocanvas.height = base.canvas.height;

    api.ctx = api.canvas.getContext(ren);
    api.octx = api.ocanvas.getContext(ren);

    if (ren == "webgl" || ren == "experimental-webgl") {
      // Alisases
      api.gl = api.ctx;
      api.ogl = api.octx;
    } else {
      api.gl = null;
      api.ogl = null;
    }
  }

  window.api = api;
})();
