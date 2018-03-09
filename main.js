/* global axios */
/*
 * TODO:
 * - make circle element move inside svg with price current price value
 * - refactor compareList and compareListObj instatinatons
 */
(function () {
  var updateFrequency = 15000; // milliseconds

  var compareList = [];
  var compareListObj = [];

  var circleOpen = '<circle cx="302" cy="52" r="2" fill="red" />';

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
    var coinObj = compareListObj[coinSymbol];
    var apiPath = api.begining + coinSymbol + api.ending;
    axios.get(apiPath)
      .then(function (response) {
        var price = response.data[coinSymbol].USD;

        callback(price, coinObj);
      })
      .catch(function (e) {
        console.log(e);
      });
  };

  var initGraphs = function (coinSymbol) {
    var coinObj = compareListObj[coinSymbol];
    loadData(api.minuteHistorical, coinSymbol, coinObj.minuteDataset, function () {
      drawGraph(coinSymbol, coinObj.minuteSvg, coinObj.minuteDataset, 60, true);
    });

    loadData(api.hourHistorical, coinSymbol, coinObj.hourlyDatasetWeek, function () {
      var hourlyDatasetDay = coinObj.hourlyDatasetWeek.slice(144);
      drawGraph(coinSymbol, coinObj.daySvg, hourlyDatasetDay, 24, false);
      drawGraph(coinSymbol, coinObj.weekSvg, coinObj.hourlyDatasetWeek, 168, false);
    });

    loadData(api.dayHistorical, coinSymbol, coinObj.dailyDatasetQuarter, function () {
      var dailyDatasetMonth = coinObj.dailyDatasetQuarter.slice(60);
      drawGraph(coinSymbol, coinObj.monthSvg, dailyDatasetMonth, 30, false);
      drawGraph(coinSymbol, coinObj.quarterSvg, coinObj.dailyDatasetQuarter, 90, false);
    });
  }

  var drawGraph = function (coinSymbol, svg, dataset, maxPeriods, isUpdating) {
    var coinObj = compareListObj[coinSymbol];
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

    if (isUpdating) {
      coinObj.oldestPrice = dataset[0];
    }

    if (tempDataset[tempDataset.length - 1] > tempDataset[0]) {
      style += 'green;" ';
      coinObj.lastColor = 'green';
    } else if (tempDataset[tempDataset.length - 1] < tempDataset[0]) {
      style += 'red;" ';
      coinObj.lastColor = 'red';
    } else {
      style += coinObj.lastColor + ';"';
    }

    for (var i = 0; i < periods; i++) {
      var dataPoint = tempDataset[i];
      var plotPoint = 102 - ((dataPoint - tempMin) / tempSpread * 100);
      var xDist = 2 + (periodCounter * 300 / maxPeriods); // = 300 / periods or svgwidth / periods
      var line = ' ' + xDist + ' ' + plotPoint;
      pathCode += line;
      svg.innerHTML = pathOpen + style + pathCode + pathClose + circleOpen;
      periodCounter += 1;
    }
  };

  var updatePrice = function (coinSymbol) {
    getLatestPrice(api.current, coinSymbol, function (price, coinObj) {
      coinObj.priceHolder.innerText = price;

      if (price > coinObj.oldestPrice) {
        coinObj.priceHolder.style.color = 'green';
      } else if (price < coinObj.oldestPrice) {
        coinObj.priceHolder.style.color = 'red';
      } else {
        coinObj.priceHolder.style.color = coinObj.lastColor;
      }
      if (coinObj.firstRun) {
        coinObj.firstRun = false;
        return;
      }
      coinObj.updateTimer++;
      if (coinObj.updateTimer === 60 / (updateFrequency / 1000)) { // one minute divided by update frequency in seconds
        coinObj.minuteDataset.shift();
        coinObj.minuteDataset.push(price);
        drawGraph(coinSymbol, coinObj.minuteSvg, coinObj.minuteDataset, 60, true);
        coinObj.updateTimer = 0;
      }
    });
  };


  compareList.push('LTC');
  compareListObj['LTC'] = {
    firstRun: true,
    lastColor: 'green',
    oldestPrice: 0,
    updateTimer: 0,
    minuteDataset: [],
    hourlyDatasetWeek: [],
    dailyDatasetQuarter: [],
    minuteSvg: document.querySelector('.LTC-minute-svg'),
    daySvg: document.querySelector('.LTC-day-svg'),
    weekSvg: document.querySelector('.LTC-week-svg'),
    monthSvg: document.querySelector('.LTC-month-svg'),
    quarterSvg: document.querySelector('.LTC-quarter-svg'),
    priceHolder: document.querySelector('.LTC-price'),
    getNewPrice: function () { updatePrice('LTC'); }
  };


  compareList.push('BTC');
  compareListObj['BTC'] = {
    firstRun: true,
    lastColor: 'green',
    oldestPrice: 0,
    updateTimer: 0,
    minuteDataset: [],
    hourlyDatasetWeek: [],
    dailyDatasetQuarter: [],
    minuteSvg: document.querySelector('.BTC-minute-svg'),
    daySvg: document.querySelector('.BTC-day-svg'),
    weekSvg: document.querySelector('.BTC-week-svg'),
    monthSvg: document.querySelector('.BTC-month-svg'),
    quarterSvg: document.querySelector('.BTC-quarter-svg'),
    priceHolder: document.querySelector('.BTC-price'),
    getNewPrice: function () { updatePrice('BTC'); }
  };

  compareList.push('NEO');
  compareListObj['NEO'] = {
    firstRun: true,
    lastColor: 'green',
    oldestPrice: 0,
    updateTimer: 0,
    minuteDataset: [],
    hourlyDatasetWeek: [],
    dailyDatasetQuarter: [],
    minuteSvg: document.querySelector('.NEO-minute-svg'),
    daySvg: document.querySelector('.NEO-day-svg'),
    weekSvg: document.querySelector('.NEO-week-svg'),
    monthSvg: document.querySelector('.NEO-month-svg'),
    quarterSvg: document.querySelector('.NEO-quarter-svg'),
    priceHolder: document.querySelector('.NEO-price'),
    getNewPrice: function () { updatePrice('BTC'); }
  };

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
