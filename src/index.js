const Logger = require('./logger');
const provisionWinston = require('./winston');
const buildPinoTransport = require('./pinoTransport');
let winston = null,
    Transport = null;

try {
  //  All the code below optionally loads winston if it's installed
  winston = require('winston');
  Transport = require('winston-transport');
} catch (err) {
  void err;
  // If winston isn't installed, proceed as usual
}

//  If we have successfully loaded winston (user has it)
//  we initialize our InsightTransport
if (winston && Transport) {
  provisionWinston(winston, Transport);
}

//  Logger is default export
module.exports = Logger;
module.exports.provisionWinston = provisionWinston;
module.exports.pinoTransport = buildPinoTransport;
