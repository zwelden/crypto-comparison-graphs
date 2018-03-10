/* global axios */
/*
 * TODO:
 * - make circle element move inside svg with price current price value
 * - refactor compareList and compareListObj instatinatons
 * - make current price updates on single api call ?
 */
(function () {
  var updateFrequency = 15000; // milliseconds

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
    loadData(api.minuteHistorical, coinSymbol, coinObj.minuteDataset, function () {
      drawGraph(coinSymbol, coinObj.minuteSvg, coinObj.minuteDataset, 60);
    });

    loadData(api.hourHistorical, coinSymbol, coinObj.hourlyDatasetWeek, function () {
      coinObj.hourlyDatasetDay = coinObj.hourlyDatasetWeek.slice(144);
      coinObj.dayOpenPrice = coinObj.hourlyDatasetDay[0];
      drawGraph(coinSymbol, coinObj.daySvg, coinObj.hourlyDatasetDay, 24, false);
      drawGraph(coinSymbol, coinObj.weekSvg, coinObj.hourlyDatasetWeek, 168);
    });

    loadData(api.dayHistorical, coinSymbol, coinObj.dailyDatasetQuarter, function () {
      coinObj.dailyDatasetMonth = coinObj.dailyDatasetQuarter.slice(60);
      drawGraph(coinSymbol, coinObj.monthSvg, coinObj.dailyDatasetMonth, 30, false);
      drawGraph(coinSymbol, coinObj.quarterSvg, coinObj.dailyDatasetQuarter, 90);
    });
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
    var pathCode = 'd="M';
    var pathClose = '" class="price-hist-path"></path>';
    var style = 'style="stroke:';
    var periodCounter = 0;
    var periods = dataset.length >= maxPeriods + 1 ? maxPeriods + 1 : dataset.length;
    var tempDataset = dataset.slice(0, periods);

    var tempMax = Math.max(...tempDataset);
    var tempMin = Math.min(...tempDataset);
    var tempSpread = tempMax - tempMin;

    style += setStyleColor(dataset[0], dataset[maxPeriods]) + ';" ';

    for (var i = 0; i < periods; i++) {
      var dataPoint = tempDataset[i];
      var plotPoint = 102 - ((dataPoint - tempMin) / tempSpread * 100);
      var xDist = 2 + (periodCounter * 300 / maxPeriods); // = 300 / periods or svgwidth / periods
      var line = ' ' + xDist + ' ' + plotPoint;
      pathCode += line;
      graphContainer.innerHTML = pathOpen + style + pathCode + pathClose;
      periodCounter += 1;
    }
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

      if (coinObj.firstRun) {
        coinObj.firstRun = false;
        return;
      }

      coinObj.updateTimer++;
      if (coinObj.updateTimer === 60 / (updateFrequency / 1000)) { // one minute divided by update frequency in seconds
        coinObj.minuteDataset.shift();
        coinObj.minuteDataset.push(price);
        drawGraph(coinSymbol, coinObj.minuteSvg, coinObj.minuteDataset, 60);
        coinObj.updateTimer = 0;
      }

      drawCurrentPriceSvgElement(coinObj.minuteSvg, coinObj.minuteDataset, price);
      drawCurrentPriceSvgElement(coinObj.daySvg, coinObj.hourlyDatasetDay, price);
      drawCurrentPriceSvgElement(coinObj.weekSvg, coinObj.hourlyDatasetWeek, price);
      drawCurrentPriceSvgElement(coinObj.monthSvg, coinObj.dailyDatasetMonth, price);
      drawCurrentPriceSvgElement(coinObj.quarterSvg, coinObj.dailyDatasetQuarter, price);
    });
  };

  var createCoin = function (symbol) {
    compareList.push(symbol);
    compareListObj[symbol] = {
      firstRun: true,
      lastColor: 'green',
      dayOpenPrice: 0,
      updateTimer: 0,
      minuteDataset: [],
      hourlyDatasetDay: [],
      hourlyDatasetWeek: [],
      dailyDatasetMonth: [],
      dailyDatasetQuarter: [],
      minuteSvg: document.querySelector('.' + symbol + '-minute-svg'),
      daySvg: document.querySelector('.' + symbol + '-day-svg'),
      weekSvg: document.querySelector('.' + symbol + '-week-svg'),
      monthSvg: document.querySelector('.' + symbol + '-month-svg'),
      quarterSvg: document.querySelector('.' + symbol + '-quarter-svg'),
      priceHolder: document.querySelector('.' + symbol + '-price'),
      getNewPrice: function () { updatePrice(symbol); }
    };
  };

  createCoin('LTC');
  createCoin('BTC');
  createCoin('NEO');

  initGraphs('LTC');
  updatePrice('LTC');
  setInterval(compareListObj['LTC'].getNewPrice, updateFrequency);

  initGraphs('BTC');
  updatePrice('BTC');
  setInterval(compareListObj['BTC'].getNewPrice, updateFrequency);

  initGraphs('NEO');
  updatePrice('NEO');
  setInterval(compareListObj['NEO'].getNewPrice, updateFrequency);
})();
