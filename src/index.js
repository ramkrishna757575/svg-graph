const keys = Object.keys(airlines);
var dataPoints = new Array(24);
var selectedAirline = 'total';
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
  var chartContainer = document.getElementById('chart-container');
  chartContainer.setAttribute("style", "height:" + availableHeight + "px");
  var chartWidth = chartContainer.clientWidth;
  var chartHeaderHeight = document.getElementById('chart-header').clientHeight;
  var bodyLeftMargin = window.getComputedStyle(document.body).marginLeft;
  plotGraph(dataPoints, selectedAirline, chartWidth, availableHeight - chartHeaderHeight, parseInt(bodyLeftMargin) + 10, 0);
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

//SVG graph related functions
function getCountsArray(graphData, attribute) {
  return graphData.map(function (item) {
    return item[attribute];
  });
}

function calculateSVGData(graphData, attribute, width, height, xoffset, yoffset) {
  var values = getCountsArray(graphData, attribute);
  return getCoordinates(values, width, height, xoffset, yoffset)
}


function getCoordinates(values, width, height, xoffset, yoffset) {
  var min = Math.floor(Math.min.apply(null, values) * 0.8);
  var max = Math.ceil(Math.max.apply(null, values) * 1.2);

  var yRatio = (max - min) / height;
  var xRatio = width / (values.length);
  return values.map(function (value, i) {
    var y = height - ((value - min) / yRatio);
    var x = (xRatio * i) - (xRatio / 2);
    return [x + xoffset, y + yoffset];
  });
}

function plotGraph(data, attribute, width, height, xoffset = 0, yoffset = 0) {
  var svgData = calculateSVGData(data, attribute, width, height, xoffset, yoffset);
  var svgChart = document.getElementById('svg-chart');
  svgChart.innerHTML = "";
  svgChart.setAttribute("style", "shape-rendering:auto;height:" + height + "px; width:" + width + "px");

  drawLine(svgChart, svgData);
  drawPoints(svgChart, svgData);
}

function drawLine(svgElement, svgData) {
  var lineData = "";
  svgData.map(function (coordinates, i) {
    var command = i === 0 ? "M" : "L";
    lineData = lineData
      + " "
      + command
      + " "
      + coordinates[0]
      + ","
      + coordinates[1]
  });

  var line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  line.setAttribute("d", lineData);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#5CC0C0");
  line.setAttribute("stroke-width", 3);
  svgElement.appendChild(line);
}

function drawPoints(svgElement, svgData) {
  svgData.map(function (coordinates) {
    var point = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );

    point.setAttribute("cx", coordinates[0]);
    point.setAttribute("cy", coordinates[1]);
    point.setAttribute("r", 4);
    point.setAttribute("fill", "#5CC0C0");
    point.setAttribute("stroke", "#fff");
    point.setAttribute("stroke-width", 2);
    svgElement.appendChild(point);
  });
}
