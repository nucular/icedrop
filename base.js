(function() {
  "use strict";

  var base = window.base || {};
  var app = window.app || {};

  base.fps = 60;
  base.time = 0;

  base.lastframe = 0;
  base.frameinterval = 1000 / base.fps;
  base.mouse = {x: 0, y: 0};
  base.fixedtimestep = false;

  base.resizeid = null;;

  // Set up the canvas, bind events
  base.init = function() {
    base.canvas = $("#screen")[0];
    base.ctx = base.canvas.getContext("2d");

    var w = $(document.body).width(), h = $(document.body).height();
    base.canvas.width = w;
    base.canvas.height = h;

    // Throttle resize events
    $(window).bind("resize", function(e) {
      clearTimeout(base.resizeid);

      base.resizeid = setTimeout(function() {
        var ow = base.canvas.width, oh = base.canvas.height;
        var w = $(document.body).width(), h = $(document.body).height();

        base.canvas.width = w;
        base.canvas.height = h;

        if (app.resize)
          app.resize(w, h, ow, oh);
      }, 200);
    });

    // base.mousemoved
    $("#screen").bind("mousemove", function(e) {
      var dx = e.clientX - base.mouse.x, dy = e.clientY - base.mouse.y;
      base.mouse.x = e.clientX;
      base.mouse.y = e.clientY;
      if (app.mousemoved)
        app.mousemoved(e.clientX, e.clientY, dx, dy);

    // base.mousepressed
    }).bind("mousedown", function(e) {
      var b;
      switch (e.button) {
        case 0:
          b = "l"; break;
        case 1:
          b = "m"; break;
        case 2:
          b = "r"; break;
      }
      if (app.mousepressed)
        app.mousepressed(b, base.mouse.x, base.mouse.y)

    // base.mousereleased
    }).bind("mouseup", function(e) {
      var b;
      switch (e.button) {
        case 0:
          b = "l"; break;
        case 1:
          b = "m"; break;
        case 2:
          b = "r"; break;
      }
      if (app.mousereleased)
        app.mousereleased(b, base.mouse.x, base.mouse.y)

    // base.mousepressed mousewheel events
    }).bind("mousewheel", function(e) {
      if (e.originalEvent.wheelDelta > 0) {
        if (app.mousepressed) app.mousepressed("wu", base.mouse.x, base.mouse.y);
        if (app.mousereleased) app.mousereleased("wu", base.mouse.x, base.mouse.y);
      } else {
        if (app.mousepressed) app.mousepressed("wd", base.mouse.x, base.mouse.y);
        if (app.mousereleased) app.mousereleased("wd", base.mouse.x, base.mouse.y);
      }
    });

    app.load();
    requestAnimationFrame(base.frame);
  };

  // Calculate elapsed time, update and draw everything
  base.frame = function() {
    requestAnimationFrame(base.frame);

    var now = performance ? performance.now() : Date.now();
    var elapsed = now - base.lastframe;
    var dt = (base.fixedtimestep ? base.frameinterval : elapsed) / 1000;
    base.time += dt;

    // Limit frame rate
    if (elapsed > base.frameinterval) {
      base.lastframe = now - (elapsed % base.frameinterval);
      app.update(dt, base.time);
      base.ctx.clearRect(0, 0, base.canvas.width, base.canvas.height);
      app.draw();
    }
  };

  // Set the FPS limit
  base.setFPS = function(fps) {
    base.fps = fps;
    base.lastframe = 0;
    base.frameinterval = 1000 / base.fps;
  };

  window.base = base;
  $(base.init);
})();
