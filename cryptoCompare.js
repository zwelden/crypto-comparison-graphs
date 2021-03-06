/* global axios */
/**
 * TODO: add parameter comments to code
 */
(function (app) {
  app.cryptoCompareGraph = (function () {
    var debug = false; // set to true for async error console logs

    var updateFrequency = 15000; // milliseconds

    var timeframes = ['hour', 'day', 'week', 'month', 'quarter'];
    var compareList = [];
    var compareListObj = [];
    var updateCoinInterval;

    var api = app.apiManager;

    var svgComponents = {
      graph: {
        pathOpen: '<path ',
        pathStroke: 'style="stroke:',
        pathStart: ';" d="M',
        pathClose: '" class="price-hist-path"></path>'
      },
      upTriangle: '<polygon points="301,0 298,5 304,5" style="fill:green;" />',
      downTriangle: '<polygon points="301,104 298,99 304,99" style="fill:red;" />',
      circle: {
        circleOpen: '<circle cx="302" cy="',
        circleRadius: '" r="2" ',
        circleFill: 'fill="',
        circleClose: '" />'
      }
    };

    var loadData = function (api, coinSymbol, targetDataset, callback) {
      var apiPath = api.begining + coinSymbol + api.ending;
      axios.get(apiPath)
        .then(function (response) {
          var data = response.data.Data;
          for (var i = 0; i < data.length; i++) {
            var datapoint = data[i].close;
            targetDataset.push(datapoint);
          }
          callback();
        })
        .catch(function (e) {
          if (debug) {
            console.log(e);
          }
        });
    };

    var getLatestPrice = function (api, coinSymbol, callback) {
      var apiPath = api.begining + coinSymbol + api.ending;
      axios.get(apiPath)
        .then(function (response) {
          var price;
          if (response.data[coinSymbol].USD > 0) {
            price = response.data[coinSymbol].USD;
          } else {
            price = response.data[coinSymbol].USD.PRICE;
          }

          callback(price, coinSymbol);
        })
        .catch(function (e) {
          if (debug) {
            console.log(e);
          }
        });
    };

    var initGraphs = function (coinSymbol) {
      var coinObj = compareListObj[coinSymbol];
      loadData(api.minuteHistorical, coinSymbol, coinObj.graphs.hour.dataset, function () {
        drawGraph(coinObj.graphs.hour.svg, coinObj.graphs.hour.dataset, 60);
      });

      loadData(api.hourHistorical, coinSymbol, coinObj.graphs.week.dataset, function () {
        coinObj.graphs.day.dataset = coinObj.graphs.week.dataset.slice(144);
        coinObj.dayOpenPrice = coinObj.graphs.day.dataset[0];
        drawGraph(coinObj.graphs.day.svg, coinObj.graphs.day.dataset, 24);
        drawGraph(coinObj.graphs.week.svg, coinObj.graphs.week.dataset, 168);
      });

      loadData(api.dayHistorical, coinSymbol, coinObj.graphs.quarter.dataset, function () {
        coinObj.graphs.month.dataset = coinObj.graphs.quarter.dataset.slice(60);
        drawGraph(coinObj.graphs.month.svg, coinObj.graphs.month.dataset, 30);
        drawGraph(coinObj.graphs.quarter.svg, coinObj.graphs.quarter.dataset, 90);
      });
    };

    var initAllGraphs = function (callback) {
      for (var i = 0; i < compareList.length; i++) {
        initGraphs(compareList[i]);
      }
      callback();
    };

    var setStyleColor = function (pastPrice, currentPrice) {
      if (currentPrice >= pastPrice) {
        return 'green';
      } else {
        return 'red';
      }
    };

    var drawGraph = function (svg, dataset, maxPeriods) {
      var graphContainer = svg.querySelector('.graph');

      var periodCounter = 0;
      var periods = dataset.length >= maxPeriods + 1 ? maxPeriods + 1 : dataset.length;
      var tempDataset = dataset.slice(0, periods);

      var tempMax = Math.max(...tempDataset);
      var tempMin = Math.min(...tempDataset);
      var tempSpread = tempMax - tempMin;

      var pathStrokeColor = setStyleColor(dataset[0], dataset[maxPeriods]);
      var pathCode = '';

      for (var i = 0; i < periods; i++) {
        var dataPoint = tempDataset[i];
        var plotPoint = 102 - ((dataPoint - tempMin) / tempSpread * 100);
        var xDist = 2 + (periodCounter * 300 / maxPeriods); // = 300 / periods or svgwidth / periods
        var line = ' ' + xDist + ' ' + plotPoint;
        pathCode += line;
        periodCounter += 1;
      }

      graphContainer.innerHTML = svgComponents.graph.pathOpen + svgComponents.graph.pathStroke + pathStrokeColor + svgComponents.graph.pathStart + pathCode + svgComponents.graph.pathClose;
    };

    var drawCurrentPriceSvgElement = function (svg, dataset, currentPrice) {
      var latestPriceContainer = svg.querySelector('.current-price');
      var svgLatestPriceObj;

      var dataStartPrice = dataset[0];
      var fillColor = setStyleColor(dataStartPrice, currentPrice);

      var dataMax = Math.max(...dataset);
      var dataMin = Math.min(...dataset);
      var dataSpread = dataMax - dataMin;

      if (currentPrice > dataMax) {
        svgLatestPriceObj = svgComponents.upTriangle;
      } else if (currentPrice < dataMin) {
        svgLatestPriceObj = svgComponents.downTriangle;
      } else {
        var yPos = 102 - ((currentPrice - dataMin) / dataSpread * 100);
        svgLatestPriceObj = svgComponents.circle.circleOpen + yPos + svgComponents.circle.circleRadius + svgComponents.circle.circleFill + fillColor + svgComponents.circle.circleClose;
      }

      latestPriceContainer.innerHTML = svgLatestPriceObj;
    };

    var setCoinPrice = function (coinObj, price) {
      coinObj.priceHolder.innerText = price;
    };

    var setCoinPriceColor = function (coinObj, price) {
      coinObj.priceHolder.style.color = setStyleColor(coinObj.dayOpenPrice, price);
    };

    var updateGraph = function (coinSymbol, coinObj, price) {
      coinObj.updateTimer++;
      if (coinObj.updateTimer === 60 / (updateFrequency / 1000)) { // one minute divided by update frequency in seconds
        coinObj.graphs.hour.dataset.shift();
        coinObj.graphs.hour.dataset.push(price);
        drawGraph(coinObj.graphs.hour.svg, coinObj.graphs.hour.dataset, 60);
        coinObj.updateTimer = 0;
      }
    };

    var updatePrice = function (coinSymbol) {
      getLatestPrice(api.current, coinSymbol, function (price, coinSymbol) {
        var coinObj = compareListObj[coinSymbol];
        setCoinPrice(coinObj, price);
        setCoinPriceColor(coinObj, price);

        if (!coinObj.firstRun) {
          updateGraph(coinSymbol, coinObj, price);
        } else {
          coinObj.firstRun = false;
        }

        for (var i = 0; i < timeframes.length; i++) {
          drawCurrentPriceSvgElement(coinObj.graphs[timeframes[i]].svg, coinObj.graphs[timeframes[i]].dataset, price);
        }
      });
    };

    var updateAllPrices = function () {
      for (var i = 0; i < compareList.length; i++) {
        var coin = compareList[i];
        compareListObj[coin].getNewPrice();
      }
    };

    var createCoin = function (symbol) {
      var coinNumSafe = isNaN(parseInt(symbol[0])) ? symbol : 'd' + symbol;
      var symbolCleaned = coinNumSafe.split('*').join('');
      compareListObj[symbol] = {
        firstRun: true,
        dayOpenPrice: 0,
        updateTimer: 0,
        graphs: {
          hour: {
            dataset: [],
            svg: document.querySelector('.hour-svg' + '[data-name=' + symbolCleaned + ']')
          },
          day: {
            dataset: [],
            svg: document.querySelector('.day-svg' + '[data-name=' + symbolCleaned + ']')
          },
          week: {
            dataset: [],
            svg: document.querySelector('.week-svg' + '[data-name=' + symbolCleaned + ']')
          },
          month: {
            dataset: [],
            svg: document.querySelector('.month-svg' + '[data-name=' + symbolCleaned + ']')
          },
          quarter: {
            dataset: [],
            svg: document.querySelector('.quarter-svg' + '[data-name=' + symbolCleaned + ']')
          }
        },
        priceHolder: document.querySelector('.latest-price' + '[data-name=' + symbolCleaned + ']'),
        getNewPrice: function () {
          updatePrice(symbol);
        }
      };
    };

    var addCoin = function (symbol) {
      if (compareList.indexOf(symbol) < 0) {
        compareList.push(symbol);
      }
    };

    var createAllCoins = function () {
      for (var i = 0; i < compareList.length; i++) {
        createCoin(compareList[i]);
      }
    };

    var initCoinComparisons = function () {
      createAllCoins();
      initAllGraphs(updateAllPrices);
      updateCoinInterval = setInterval(updateAllPrices, updateFrequency);
    };

    var deactivateCoinComparisons = function () {
      clearInterval(updateCoinInterval);
      compareList.length = 0;
      compareListObj.length = 0;
    };

    return {
      addCoin: addCoin,
      initCoinComparisons: initCoinComparisons,
      deactivateCoinComparisons: deactivateCoinComparisons
    };
  })();
})(window.app = window.app || {});
