(function (app) {
  var graphHolder = app.coinGraphHolder;
  graphHolder.constructCoinGraphMarkup('LTC', 'Litecoin');
  graphHolder.constructCoinGraphMarkup('BTC', 'Bitcoin');
  graphHolder.constructCoinGraphMarkup('NEO', 'Neo');

  var coinGraph = window.app.cryptoCompareGraph;
  coinGraph.addCoin('LTC');
  coinGraph.addCoin('BTC');
  coinGraph.addCoin('NEO');

  coinGraph.initCoinComparisons();

})(window.app = window.app || {});
