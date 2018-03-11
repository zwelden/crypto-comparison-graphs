(function (app) {
  var markupSections = {
    coinGraphsWrapperClass: 'coin-content-wrapper',
    sectionWrapperClass: 'coin-data-wrapper',
    sectionTitleClass: 'coin-data-title',
    svgContainerClass: 'svg-container',
    svgGraphSectionWrapperClass: 'svg-graph-section-wrapper-',
    title: { // needs Title
      open: '<h2>',
      close: '</h2>'
    },
    currentPriceContainer: { // needs SYM
      className: 'current-price',
      open: 'Latest Price:<br><span class="latest-price ',
      close: '-price"></span>'
    },
    svg: { // needs SYM-time
      open: '<svg class="',
      close: '-svg" width="304" height="104" viewBox="0 0 304 104">' +
        '<g class="graph"></g>' +
        '<g class="current-price"></g>' +
        '</svg>'
    }
  };

  var timeSections = [
    {
      title: 'Past Hour',
      classInsert: 'hour'
    },
    {
      title: 'Past 24 Hours',
      classInsert: 'day'
    },
    {
      title: 'Past 7 Days',
      classInsert: 'week'
    },
    {
      title: 'Past 30 Days',
      classInsert: 'month'
    },
    {
      title: 'Past 90 Days',
      classInsert: 'quarter'
    }
  ];

  var coinGraphsWrapperEl = document.querySelector('.' + markupSections.coinGraphsWrapperClass);

  var constructCoinDataTitle = function (title) {
    var coinTitle = document.createElement('h2');
    coinTitle.classList.add(markupSections.sectionTitleClass);
    coinTitle.innerText = title;
    return coinTitle;
  };

  var constructCurrentPriceSection = function (symbol) {
    var latestPriceWrapper = document.createElement('div');
    latestPriceWrapper.classList.add(markupSections.currentPriceContainer.className);
    latestPriceWrapper.innerHTML = markupSections.currentPriceContainer.open + symbol + markupSections.currentPriceContainer.close;
    return latestPriceWrapper;
  };

  var constructSvgGraphTitle = function (title) {
    var graphTitle = document.createElement('h3');
    graphTitle.innerText = title;
    return graphTitle;
  };

  var constructSvgGraphSvg = function (symbol, timeframeClass) {
    var svgContainer = document.createElement('div');
    svgContainer.classList.add(markupSections.svgContainerClass);
    svgContainer.innerHTML = markupSections.svg.open + symbol + '-' + timeframeClass + markupSections.svg.close;
    return svgContainer;
  };

  var constructSvgGraphSectionWrapper = function (timeframeClass) {
    var svgGraphSectionWrapper = document.createElement('div');
    svgGraphSectionWrapper.classList.add(markupSections.svgGraphSectionWrapperClass + timeframeClass);
    return svgGraphSectionWrapper;
  };

  var constructCoinGraphWrapper = function (symbol) {
    var graphWrapper = document.createElement('div');
    graphWrapper.classList.add(markupSections.sectionWrapperClass);
    graphWrapper.classList.add(markupSections.sectionWrapperClass + '-' + symbol);
    return graphWrapper;
  };

  var constructCoinGraphMarkup = function (coinSymbol, coinTitle) {
    var graphWrapper = constructCoinGraphWrapper(coinSymbol);
    var coinDataTitle = constructCoinDataTitle(coinTitle);
    var currentPrice = constructCurrentPriceSection(coinSymbol);
    graphWrapper.appendChild(coinDataTitle);
    graphWrapper.appendChild(currentPrice);

    for (var i = 0; i < timeSections.length; i++) {
      var timeframeTitle = timeSections[i].title;
      var timeframeClass = timeSections[i].classInsert;
      var svgGraphSection = constructSvgGraphSectionWrapper(timeframeClass);
      var svgGraphTitle = constructSvgGraphTitle(timeframeTitle);
      var svgGraphSvg = constructSvgGraphSvg(coinSymbol, timeframeClass);
      svgGraphSection.appendChild(svgGraphTitle);
      svgGraphSection.appendChild(svgGraphSvg);
      graphWrapper.appendChild(svgGraphSection);
    }
    coinGraphsWrapperEl.appendChild(graphWrapper);
  };

  constructCoinGraphMarkup('LTC', 'Litecoin');
  constructCoinGraphMarkup('BTC', 'Bitcoin');
  constructCoinGraphMarkup('NEO', 'Neo');
})(window.app = window.app || {});
