(function () {
  var firstRun = true;

  var ltcMinuteSvg = document.querySelector('.ltc-minute-svg');
  var ltcDaySvg = document.querySelector('.ltc-day-svg');
  var ltcWeekSvg = document.querySelector('.ltc-week-svg');
  var ltcMonthSvg = document.querySelector('.ltc-month-svg');
  var ltcQuarterSvg = document.querySelector('.ltc-quarter-svg');
  var svgRect = ltcMinuteSvg.getBoundingClientRect();
  var lastColor = 'green';
  var oldestPrice = 0;
  var minuteDataset = [];
  var hourlyDatasetWeek = [];
  var hourlyDatasetDay = [];
  var dailyDatasetMonth = [];
  var dailyDatasetQuarter = [];


  var historicalMinutePriceApi = 'https://min-api.cryptocompare.com/data/histominute?fsym=LTC&tsym=USD&limit=60&extraParams=ltc_live_price';
  var historicalHourlyPriceApi = 'https://min-api.cryptocompare.com/data/histohour?fsym=LTC&tsym=USD&limit=168&extraParams=ltc_live_price';
  var historicalDailyPriceApi = 'https://min-api.cryptocompare.com/data/histoday?fsym=LTC&tsym=USD&limit=90&extraParams=ltc_live_price';
  var currentPriceApi = 'https://min-api.cryptocompare.com/data/price?fsym=LTC&tsyms=USD&extraParams=ltc_live_price';

  axios.get(historicalMinutePriceApi)
    .then(function (response) {
      var dataRaw = response.data.Data;
      var data = dataRaw;
      for (var i = 0; i < data.length; i++) {
        var datapoint = data[i].close;
        minuteDataset.push(datapoint);
      }
      drawGraph(ltcMinuteSvg, minuteDataset, 60, true);
    })
    .catch(function (e) {
      console.log(e);
    });

  axios.get(historicalHourlyPriceApi)
    .then(function (response) {
      var dataRaw = response.data.Data;
      var data = dataRaw;
      for (var i = 0; i < data.length; i++) {
        var datapoint = data[i].close;
        hourlyDatasetWeek.push(datapoint);
      }
      hourlyDatasetDay = hourlyDatasetWeek.slice(144);
      drawGraph(ltcDaySvg, hourlyDatasetDay, 24, false);
      drawGraph(ltcWeekSvg, hourlyDatasetWeek, 168, false);
    })
    .catch(function (e) {
      console.log(e);
    });

  axios.get(historicalDailyPriceApi)
    .then(function (response) {
      var dataRaw = response.data.Data;
      var data = dataRaw;
      for (var i = 0; i < data.length; i++) {
        var datapoint = data[i].close;
        dailyDatasetQuarter.push(datapoint);
      }
      dailyDatasetMonth = dailyDatasetQuarter.slice(60);
      drawGraph(ltcMonthSvg, dailyDatasetMonth, 30, false);
      drawGraph(ltcQuarterSvg, dailyDatasetQuarter, 90, false);
    })
    .catch(function (e) {
      console.log(e);
    });

  var drawGraph = function (svg, dataset, maxPeriods, isUpdating) {
    var pathOpen = '<path ';
    var pathCode = 'd="M';
    var pathClose = '" class="price-hist-path">';
    var style = 'style="stroke:';
    var periodCounter = 0;
    var periods = dataset.length >= maxPeriods + 1 ? maxPeriods + 1 : dataset.length;
    var tempDataset = dataset.slice(0, periods);
    var tempMax = Math.max(...tempDataset);
    var tempMin = Math.min(...tempDataset);
    var tempSpread = tempMax - tempMin;

    if (isUpdating) {
      oldestPrice = dataset[0];
    }

    if (tempDataset[tempDataset.length - 1] > tempDataset[0]) {
      style += 'green;" ';
      lastColor = 'green';
    } else if (tempDataset[tempDataset.length - 1] < tempDataset[0]) {
      style += 'red;" ';
      lastColor = 'red';
    } else {
      style += lastColor + ';"';
    }

    for (var i = 0; i < periods; i++) {
      var dataPoint = tempDataset[i];
      var plotPoint = 102 - ((dataPoint - tempMin) / tempSpread * 100);
      var xDist = 2 + (periodCounter * 300 / maxPeriods); // = 300 / periods or svgwidth / periods
      var line = ' ' + xDist + ' ' + plotPoint;
      pathCode += line;
      svg.innerHTML = pathOpen + style + pathCode + pathClose;
      periodCounter += 1;
    }
  };


  var priceHolder = document.querySelector('.ltc-price');
  var updateTimer = 0;
  var updatePrice = function () {
    axios.get(currentPriceApi)
      .then(function (response) {
        var price = response.data.USD;
        priceHolder.innerText = price;

        if (price > oldestPrice) {
          priceHolder.style.color = 'green';
        } else if (price < oldestPrice) {
          priceHolder.style.color = 'red';
        } else {
          priceHolder.style.color = lastColor;
        }
        if (firstRun) {
          firstRun = false;
          return;
        }
        updateTimer++;
        if (updateTimer === 2) {
          minuteDataset.shift();
          minuteDataset.push(price);
          drawGraph(ltcMinuteSvg, minuteDataset, 60);
          updateTimer = 0;
        }
      })
      .catch(function (e) {
        console.log(e);
      });
  };

  updatePrice();
  setInterval(updatePrice, 30000);
})();
