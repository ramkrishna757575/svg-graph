const keys = Object.keys(airlines);
const HOURS = 24;
const ALL_AIRLINES_KEY = 'total';
const ALL_AIRLINES_VALUE = 'All Airlines';
var dataPoints = new Array(HOURS);
var selectedAirline = ALL_AIRLINES_KEY;
var initialCounterObj = {};
keys.map(function (key) {
  initialCounterObj[key] = 0;
});

initialCounterObj[ALL_AIRLINES_KEY] = 0;
initDataPoints(dataPoints);
flights_jan_01_2008.map(function (data) {
  if (!!data) {
    var dataKeys = Object.keys(data);
    if (dataKeys.indexOf('airline') > -1 && dataKeys.indexOf('time') > -1 && keys.indexOf(data.airline) > -1) {
      var timeValues = data.time.split(':');
      if (timeValues.length === 3) {
        var bucket = parseInt(timeValues[0]);
        if (!!dataPoints[bucket]) {
          dataPoints[bucket][ALL_AIRLINES_KEY] += 1;
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
  setGraphHeaders();
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

function calculateSVGData(graphData, attribute, width, height, xOffset = 0, yOffset = 0) {
  var values = getCountsArray(graphData, attribute);
  return getCoordinates(values, width, height, xOffset, yOffset)
}


function getCoordinates(values, width, height, xOffset = 0, yOffset = 0) {
  var min = Math.floor(Math.min.apply(null, values) * 0.8);
  var max = Math.ceil(Math.max.apply(null, values) * 1.2);

  var yRatio = (max - min) / height;
  var xRatio = width / (values.length);
  var coordinates = values.map(function (value, i) {
    var y = height - ((value - min) / yRatio);
    var x = (xRatio * i) - (xRatio / 2);
    return [x + xOffset, y + yOffset];
  });
  return {coordinates: coordinates, distance: xRatio};
}

function plotGraph(data, attribute, width, height, xOffset = 0, yOffset = 0) {
  var calculatedData = calculateSVGData(data, attribute, width, height, xOffset, yOffset);
  var svgData = calculatedData.coordinates;
  var svgChart = document.getElementById('svg-chart');
  svgChart.innerHTML = "";
  svgChart.setAttribute("style", "shape-rendering:auto;height:" + height + "px; width:" + width + "px");

  drawArea(svgChart, svgData, height, calculatedData.distance);
  drawGridLines(svgChart, data.length, calculatedData.distance, height);
  drawSelectionBackground(svgChart, data.length, calculatedData.distance, height);
  drawClipPath(svgChart, svgData, calculatedData.distance, height);
  drawSelectionForeground(svgChart, data.length, calculatedData.distance, height);
  drawLine(svgChart, svgData);
  drawPoints(svgChart, svgData);
  drawValues(svgChart, svgData, data, attribute);
  drawTransparentIntervalRects(svgChart, data.length, calculatedData.distance, height);
  addHoverListeners();
}

function getLineCommand(svgData) {
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
  return lineData;
}

function drawLine(svgElement, svgData) {
  var lineData = getLineCommand(svgData);
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

function drawArea(svgElement, svgData, height, xDistance) {
  var areaPoints = getLineCommand(svgData);
  areaPoints = areaPoints
    + ' L' + (svgData[svgData.length - 1][0] + xDistance) + ", " + svgData[svgData.length - 1][1]
    + ' L' + (svgData[svgData.length - 1][0] + xDistance) + ", " + height
    + ' L' + 0 + ", " + height
    + ' L' + 0 + ", " + svgData[0][1]
    + ' L' + svgData[0][0] + ", " + svgData[0][1]
    + ' z';

  var area = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  area.setAttribute("d", areaPoints);
  area.setAttribute("fill", "#f6f6f6");
  svgElement.appendChild(area);
}

function drawGridLines(svgElement, dataCount, xDistance, height) {
  var lineData = "";
  for (var i = 1; i < dataCount; i++) {
    lineData += "M " + (xDistance * i) + "," + height + " L " + (xDistance * i) + ",0";
  }

  var line = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  line.setAttribute("d", lineData);
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#eaeaea");
  line.setAttribute("stroke-width", 1);
  svgElement.appendChild(line);
}

function drawTransparentIntervalRects(svgElement, dataCount, xDistance, height) {
  for (var i = 1; i <= dataCount; i++) {
    var rect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("width", xDistance);
    rect.setAttribute("height", height);
    rect.setAttribute("x", xDistance * (i - 1));
    rect.setAttribute("y", 0);
    rect.setAttribute("fill", "transparent");
    rect.setAttribute('class', 'hoverArea');
    svgElement.appendChild(rect);
  }
}

function drawSelectionForeground(svgElement, dataCount, xDistance, height) {
  for (var i = 1; i <= dataCount; i++) {
    var rect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("width", xDistance);
    rect.setAttribute("height", height);
    rect.setAttribute("x", xDistance * (i - 1));
    rect.setAttribute("y", 0);
    rect.setAttribute("fill", "#5CC0C0");
    rect.setAttribute("clip-path", "url(#graphClipPath)");
    rect.style.display = 'none';
    rect.setAttribute('class', 'selectionForeground');
    svgElement.appendChild(rect);
  }
}

function drawSelectionBackground(svgElement, dataCount, xDistance, height) {
  for (var i = 1; i <= dataCount; i++) {
    var rect = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "rect"
    );
    rect.setAttribute("width", xDistance);
    rect.setAttribute("height", height);
    rect.setAttribute("x", xDistance * (i - 1));
    rect.setAttribute("y", 0);
    rect.setAttribute("fill", "#f6f6f6");
    rect.style.display = 'none';
    rect.setAttribute('class', 'selectionBackground');
    svgElement.appendChild(rect);
  }
}

function drawClipPath(svgElement, svgData, xDistance, height) {
  var clipPathElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "clipPath"
  );
  clipPathElement.setAttribute("id", "graphClipPath");
  svgElement.appendChild(clipPathElement);
  var clipPathPoints = getLineCommand(svgData);
  clipPathPoints = clipPathPoints
    + ' L' + (svgData[svgData.length - 1][0] + xDistance) + ", " + svgData[svgData.length - 1][1]
    + ' L' + (svgData[svgData.length - 1][0] + xDistance) + ", " + height
    + ' L' + 0 + ", " + height
    + ' L' + 0 + ", " + svgData[0][1]
    + ' L' + svgData[0][0] + ", " + svgData[0][1]
    + ' z';

  var clipPath = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "path"
  );
  clipPath.setAttribute("d", clipPathPoints);
  clipPathElement.appendChild(clipPath);
}

function drawValues(svgElement, svgData, data, attribute) {
  for (var i = 0; i < data.length; i++) {
    var value = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "text"
    );
    value.setAttribute("x", svgData[i][0] - 10);
    value.setAttribute("y", svgData[i][1] - 10);
    value.setAttribute("class", "pointValue");
    value.setAttribute("style", "font:italic 15px sans-serif;fill:#9c27b0;");
    value.textContent = data[i][attribute];
    value.style.display = 'none';
    svgElement.appendChild(value);
  }
}

function indexInClass(node, myClass) {
  var className = node.className;
  var num = 0;
  for (var i = 0; i < myClass.length; i++) {
    if (myClass[i] === node) {
      return num;
    }
    num++;
  }

  return -1;
}

function addHoverListeners() {
  var hoverAreas = document.getElementsByClassName("hoverArea");
  for (var i = 0; i < hoverAreas.length; i++) {
    hoverAreas[i].addEventListener('mouseover', function (event) {
      setSelection(indexInClass(event.target, hoverAreas));
    });
    hoverAreas[i].addEventListener('mouseout', function (event) {
      removeSelection(indexInClass(event.target, hoverAreas));
    });
  }
}

function removeSelection(i) {
  var selectionBackgrounds = document.getElementsByClassName("selectionBackground");
  var selectionForegrounds = document.getElementsByClassName("selectionForeground");
  var selectedValues = document.getElementsByClassName("pointValue");
  selectionBackgrounds[i].style.display = 'none';
  selectionForegrounds[i].style.display = 'none';
  selectedValues[i].style.display = 'none';
}

function setSelection(i) {
  var selectionBackgrounds = document.getElementsByClassName("selectionBackground");
  var selectionForegrounds = document.getElementsByClassName("selectionForeground");
  var selectedValues = document.getElementsByClassName("pointValue");
  selectionBackgrounds[i].style.display = 'block';
  selectionForegrounds[i].style.display = 'block';
  selectedValues[i].style.display = 'block';
}

function setGraphHeaders() {
  var flightsCountElement = document.getElementById("flights-count");
  var flightsCount = 0;
  for (var i = 0; i < dataPoints.length; i++) {
    flightsCount += dataPoints[i][selectedAirline];
  }
  flightsCountElement.innerText = flightsCount + " flights";

  var airlineNameElement = document.getElementById("airline-name");
  airlineNameElement.innerText = airlines[selectedAirline] || ALL_AIRLINES_VALUE;
}
