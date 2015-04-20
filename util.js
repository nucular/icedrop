function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function chooseProperty(obj) {
  var result;
  var count = 0;
  for (var prop in obj)
    if (Math.random() < 1/++count)
      result = prop;
  return result;
}

jQuery.fn.animateAuto = function(prop, speed, callback){
  var elem, height, width;
  return this.each(function(i, el){
    el = jQuery(el), elem = el.clone().css({"height":"auto","width":"auto"}).appendTo("body");
    height = elem.css("height"),
    width = elem.css("width"),
    elem.remove();
    
    if(prop === "height")
      el.animate({"height":height}, speed, callback);
    else if(prop === "width")
      el.animate({"width":width}, speed, callback);  
    else if(prop === "both")
      el.animate({"width":width,"height":height}, speed, callback);
  });
}
