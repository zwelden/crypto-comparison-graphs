/* global axios */
(function (app) {
  var debug = false;
  var coinListApi = app.apiManager.coinList;
  var coinListOptions = [];
  var selectElements = document.querySelectorAll('.crypto-select');

  var selectOptionsMarkup = {
    firstOption: '<option selected disabled value="0">Choose A Crypto</option>',
    openTag: '<option value="',
    openTagEnd: '">',
    closeTag: '</option>'
  };

  var initCoinOptions = function () {
    axios.get(coinListApi)
      .then(function (response) {
        var data = response.data.Data;
        loadCoinListOptions(data);
        coinListOptions.sort(sortCoinList);
        fillSelectElements();
      })
      .catch(function (e) {
        if (debug) {
          console.log(e);
        }
      });
  };

  var loadCoinListOptions = function (data) {
    for (var coin in data) {
      if (data.hasOwnProperty(coin)) {
        coinListOptions.push({
          symbol: data[coin].Symbol,
          name: data[coin].CoinName
        });
      }
    }
  };

  var sortCoinList = function (a, b) {
    var aName = a.name.trim().toLowerCase();
    var bName = b.name.trim().toLowerCase();
    if (aName < bName) {
      return -1;
    } else if (aName > bName) {
      return 1;
    } else {
      return 0;
    }
  };

  var fillSelectElements = function () {
    for (var i = 0; i < selectElements.length; i++) {
      var selectEl = selectElements[i];
      var innerhtml = '';
      innerhtml += selectOptionsMarkup.firstOption;

      for (var j = 0; j < coinListOptions.length; j++) {
        var coin = coinListOptions[j];
        innerhtml += selectOptionsMarkup.openTag + coin.symbol + selectOptionsMarkup.openTagEnd + coin.name + selectOptionsMarkup.closeTag;
      }

      selectEl.innerHTML = innerhtml;
    }
  };

  initCoinOptions();
})(window.app = window.app || {});
