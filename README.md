# Cryptocurrency Comparison Graphs
A simple comparison graphing tool for analyzing historical trends of various cryptocurrencies.
Uses cryptocompare.com/api for all data feeds.
Generates graphs for past hour, day, week, month, and quarter, and updates the latest price every 15 seconds and updates the hour graph every minute.

## Live project
[View Live Site](https://zwelden.github.io/crypto-comparison-graphs/)

## TODO
- [ ] Add webpack/gulp
- [ ] Separate styles into sass files
- [X] Add selection options
- [ ] make responsive for mobile
- [ ] add popup view graph (perhaps with more info/lines/datapoints/etc)
- [ ] add high/low/%change info
- [ ] make sure initial price loads only after all graphs finish loading (maybe pubsub it?)
- [ ] add image next to coin name
- [ ] add price movement indicator next to current price
- [ ] ensure capability to select less than 3 coins
- [ ] create graph overlay functionality (i.e. multiple graphs in one)
