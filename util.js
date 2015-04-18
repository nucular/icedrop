function choice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function choiceFromObject(obj) {
  var result;
  var count = 0;
  for (var prop in obj)
    if (Math.random() < 1/++count)
      result = obj[prop];
  return result;
}
