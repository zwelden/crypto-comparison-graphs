/* global axios */
/*
 * TODO:
 * - refactor compareList and compareListObj instatinatons
 * - make current price updates on single api call ?
 */
(function () {
  var updateFrequency = 15000; // milliseconds

  var timeframes = ['hour', 'day', 'week', 'month', 'quarter'];
  var compareList = [];
  var compareListObj = [];

  var api = {
    minuteHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histominute?fsym=',
      ending: '&tsym=USD&limit=60&extraParams=ltc_live_price'
    },
    hourHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histohour?fsym=',
      ending: '&tsym=USD&limit=168&extraParams=ltc_live_price'
    },
    dayHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histoday?fsym=',
      ending: '&tsym=USD&limit=90&extraParams=ltc_live_price'
    },
    current: {
      begining: 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=',
      ending: '&tsyms=USD&extraParams=ltc_live_price'
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
        console.log(e);
      });
  };

  var getLatestPrice = function (api, coinSymbol, callback) {
    var apiPath = api.begining + coinSymbol + api.ending;
    axios.get(apiPath)
      .then(function (response) {
        var price = response.data[coinSymbol].USD;

        callback(price, coinSymbol);
      })
      .catch(function (e) {
        console.log(e);
      });
  };

  var initGraphs = function (coinSymbol) {
    var coinObj = compareListObj[coinSymbol];
    loadData(api.minuteHistorical, coinSymbol, coinObj.graphs.hour.dataset, function () {
      drawGraph(coinSymbol, coinObj.graphs.hour.svg, coinObj.graphs.hour.dataset, 60);
    });

    loadData(api.hourHistorical, coinSymbol, coinObj.graphs.week.dataset, function () {
      coinObj.graphs.day.dataset = coinObj.graphs.week.dataset.slice(144);
      coinObj.dayOpenPrice = coinObj.graphs.day.dataset[0];
      drawGraph(coinSymbol, coinObj.graphs.day.svg, coinObj.graphs.day.dataset, 24, false);
      drawGraph(coinSymbol, coinObj.graphs.week.svg, coinObj.graphs.week.dataset, 168);
    });

    loadData(api.dayHistorical, coinSymbol, coinObj.graphs.quarter.dataset, function () {
      coinObj.graphs.month.dataset = coinObj.graphs.quarter.dataset.slice(60);
      drawGraph(coinSymbol, coinObj.graphs.month.svg, coinObj.graphs.month.dataset, 30, false);
      drawGraph(coinSymbol, coinObj.graphs.quarter.svg, coinObj.graphs.quarter.dataset, 90);
    });
  };

  var initAllGraphs = function () {
    for (var i = 0; i < compareList.length; i++) {
      initGraphs(compareList[i]);
    }
  };

  var setStyleColor = function (pastPrice, currentPrice) {
    if (currentPrice >= pastPrice) {
      return 'green';
    } else {
      return 'red';
    }
  };

  var drawGraph = function (coinSymbol, svg, dataset, maxPeriods) {
    var graphContainer = svg.querySelector('.graph');
    var pathOpen = '<path ';
    var pathStroke = 'style="stroke:';
    var pathStart = ';" d="M';
    var pathClose = '" class="price-hist-path"></path>';

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

    graphContainer.innerHTML = pathOpen + pathStroke + pathStrokeColor + pathStart + pathCode + pathClose;
  };

  var drawCurrentPriceSvgElement = function (svg, dataset, currentPrice) {
    var latestPriceContainer = svg.querySelector('.current-price');
    var svgLatestPriceObj;

    var upTriangle = '<polygon points="301,0 298,5 304,5" style="fill:green;" />';
    var downTriangle = '<polygon points="301,104 298,99 304,99" style="fill:red;" />';
    var circleOpen = '<circle cx="302" ';
    var circleY = 'cy="';
    var circleRadius = '" r="2" ';
    var circleFill = 'fill="';
    var circleClose = '" />';
    var dataStartPrice = dataset[0];
    var fillColor = setStyleColor(dataStartPrice, currentPrice);

    var dataMax = Math.max(...dataset);
    var dataMin = Math.min(...dataset);
    var dataSpread = dataMax - dataMin;

    if (currentPrice > dataMax) {
      svgLatestPriceObj = upTriangle;
    } else if (currentPrice < dataMin) {
      svgLatestPriceObj = downTriangle;
    } else {
      var yPos = 102 - ((currentPrice - dataMin) / dataSpread * 100);
      svgLatestPriceObj = circleOpen + circleY + yPos + circleRadius + circleFill + fillColor + circleClose;
    }

    latestPriceContainer.innerHTML = svgLatestPriceObj;
  };

  var updatePrice = function (coinSymbol) {
    getLatestPrice(api.current, coinSymbol, function (price, coinSymbol) {
      var coinObj = compareListObj[coinSymbol];
      coinObj.priceHolder.innerText = price;

      coinObj.priceHolder.style.color = setStyleColor(coinObj.dayOpenPrice, price);

      if (!coinObj.firstRun) {
        coinObj.updateTimer++;
        if (coinObj.updateTimer === 60 / (updateFrequency / 1000)) { // one minute divided by update frequency in seconds
          coinObj.graphs.hour.dataset.shift();
          coinObj.graphs.hour.dataset.push(price);
          drawGraph(coinSymbol, coinObj.graphs.hour.svg, coinObj.graphs.hour.dataset, 60);
          coinObj.updateTimer = 0;
        }
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
    compareListObj[symbol] = {
      firstRun: true,
      dayOpenPrice: 0,
      updateTimer: 0,
      graphs: {
        hour: {
          dataset: [],
          svg: document.querySelector('.' + symbol + '-minute-svg')
        },
        day: {
          dataset: [],
          svg: document.querySelector('.' + symbol + '-day-svg')
        },
        week: {
          dataset: [],
          svg: document.querySelector('.' + symbol + '-week-svg')
        },
        month: {
          dataset: [],
          svg: document.querySelector('.' + symbol + '-month-svg')
        },
        quarter: {
          dataset: [],
          svg: document.querySelector('.' + symbol + '-quarter-svg')
        }
      },
      priceHolder: document.querySelector('.' + symbol + '-price'),
      getNewPrice: function () { updatePrice(symbol); }
    };
  };

  var createAllCoins = function () {
    for (var i = 0; i < compareList.length; i++) {
      createCoin(compareList[i]);
    }
  };

  compareList.push('LTC');
  compareList.push('BTC');
  compareList.push('NEO');

  createAllCoins();
  initAllGraphs();
  setTimeout(updateAllPrices, 100);
  setInterval(updateAllPrices, updateFrequency);
})();
