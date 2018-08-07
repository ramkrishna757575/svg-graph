const keys = Object.keys(airlines);
var dataPoints = new Array(24);

var initialCounterObj = {};
keys.map(function (key) {
  initialCounterObj[key] = 0;
});
initialCounterObj["total"] = 0;
initDataPoints(dataPoints);
flights_jan_01_2008.map(function (data) {
  if (!!data) {
    var dataKeys = Object.keys(data);
    if (dataKeys.indexOf('airline') > -1 && dataKeys.indexOf('time') > -1 && keys.indexOf(data.airline) > -1) {
      var timeValues = data.time.split(':');
      if (timeValues.length === 3) {
        var bucket = parseInt(timeValues[0]);
        if (!!dataPoints[bucket]) {
          dataPoints[bucket]["total"] += 1;
          dataPoints[bucket][data.airline] += 1;
        }
      }
    }
  }
});

console.log(dataPoints);

function initDataPoints(dataPoints) {
  for (var i = 0; i < dataPoints.length; i++) {
    dataPoints[i] = Object.assign({}, initialCounterObj);
  }
}

function initChart() {
  recalculateChartSize();
}

function recalculateChartSize() {
  var headerHeight = document.getElementById('header').clientHeight;
  var windowHeight = window.innerHeight;
  var availableHeight = windowHeight - headerHeight - Math.ceil(windowHeight / 5);
  document.getElementById('chart-container').setAttribute("style", `height:${availableHeight}px`);
}

window.onload = initChart();

window.onresize = function () {
  var resizeTimeout;
  if (!resizeTimeout) {
    resizeTimeout = setTimeout(function () {
      resizeTimeout = null;
      recalculateChartSize();
    }, 300);
  }
};
