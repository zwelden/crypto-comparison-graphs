(function (app) {
  var graphHolder = app.coinGraphHolder;
  var coinGraph = window.app.cryptoCompareGraph;

  graphHolder.constructCoinGraphMarkup('LTC', 'Litecoin');
  graphHolder.constructCoinGraphMarkup('BTC', 'Bitcoin');
  graphHolder.constructCoinGraphMarkup('ETH', 'Ethereum');

  coinGraph.addCoin('LTC');
  coinGraph.addCoin('BTC');
  coinGraph.addCoin('ETH');

  coinGraph.initCoinComparisons();

  var graphActivator = document.querySelector('.crypto-graph-activator');
  var coinSelectors = document.querySelectorAll('.crypto-select');

  graphActivator.addEventListener('click', function () {
    coinGraph.deactivateCoinComparisons();
    graphHolder.removeAllGraphs();

    for (var selector in coinSelectors) {
      if (coinSelectors.hasOwnProperty(selector)) {
        var el = coinSelectors[selector];
        var symbol = el.value;
        var title = el.options[el.selectedIndex].text;
        graphHolder.constructCoinGraphMarkup(symbol, title);
        coinGraph.addCoin(symbol);
      }
    }

    coinGraph.initCoinComparisons();
  });
})(window.app = window.app || {});
