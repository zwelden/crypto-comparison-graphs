(function (app) {
  app.apiManager = {
    coinList: 'https://min-api.cryptocompare.com/data/all/coinlist?extraParams=crypto_live_price',
    minuteHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histominute?fsym=',
      ending: '&tsym=USD&limit=60&extraParams=crypto_live_price'
    },
    hourHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histohour?fsym=',
      ending: '&tsym=USD&limit=168&extraParams=crypto_live_price'
    },
    dayHistorical: {
      begining: 'https://min-api.cryptocompare.com/data/histoday?fsym=',
      ending: '&tsym=USD&limit=90&extraParams=crypto_live_price'
    },
    current: {
      begining: 'https://min-api.cryptocompare.com/data/pricemulti?fsyms=',
      ending: '&tsyms=USD&extraParams=crypto_live_price'
    }
  };
})(window.app = window.app || {});
