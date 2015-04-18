(function() {
  "use strict";

  var app = window.app || {};
  window.app = app;

  app.fps = 60;

  app.lastframe = 0;
  app.frameinterval = 1000 / app.fps;
  app.mouse = {x: 0, y: 0};

  // Set up the canvas, bind events
  app.init = function() {
    app.canvas = $("#screen")[0];
    app.ctx = app.canvas.getContext("2d");

    var w = $(document.body).width(), h = $(document.body).height();
    app.canvas.width = w;
    app.canvas.height = h;

    // Throttle resize events
    var rid;
    $(window).bind("resize", function(e) {
      clearTimeout(rid);

      rid = setTimeout(function() {
        var w = $(document.body).width(), h = $(document.body).height();

        app.canvas.width = w;
        app.canvas.height = h;

        if (app.resize)
          app.resize(w, h);
      }, 200);
    });

    // app.mousemoved
    $("#screen").bind("mousemove", function(e) {
      var dx = e.clientX - app.mouse.x, dy = e.clientY - app.mouse.y;
      app.mouse.x = e.clientX;
      app.mouse.y = e.clientY;
      if (app.mousemoved)
        app.mousemoved(e.clientX, e.clientY, dx, dy);

    // app.mousepressed
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
        app.mousepressed(b, app.mouse.x, app.mouse.y)

    // app.mousereleased
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
        app.mousereleased(b, app.mouse.x, app.mouse.y)

    // app.mousepressed mousewheel events
    }).bind("mousewheel", function(e) {
      if (e.originalEvent.wheelDelta > 0) {
        if (app.mousepressed) app.mousepressed("wu", app.mouse.x, app.mouse.y);
        if (app.mousereleased) app.mousereleased("wu", app.mouse.x, app.mouse.y);
      } else {
        if (app.mousepressed) app.mousepressed("wd", app.mouse.x, app.mouse.y);
        if (app.mousereleased) app.mousereleased("wd", app.mouse.x, app.mouse.y);
      }
    });

    app.load();
    requestAnimationFrame(app.frame);
  };

  // Calculate elapsed time, update and draw everything
  app.frame = function() {
    requestAnimationFrame(app.frame);

    var now = performance ? performance.now() : Date.now();
    var elapsed = now - app.lastframe;

    // Limit frame rate
    if (elapsed > app.frameinterval) {
      app.lastframe = now - (elapsed % app.frameinterval);
      app.update((app.fixedtimestep ? app.frameinterval : elapsed) / 1000);
      app.draw();
    }
  };

  // Set the FPS limit
  app.setFPS = function(fps) {
    app.fps = fps;
    app.lastframe = 0;
    app.frameinterval = 1000 / app.fps;
  };

  $(app.init);

})();
