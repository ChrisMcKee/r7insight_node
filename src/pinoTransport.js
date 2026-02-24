const _ = require('lodash');
const {Writable} = require('stream');

const Logger = require('./logger');

const defaultLevelMap = {
  10: 'debug',
  20: 'debug',
  30: 'info',
  40: 'warning',
  50: 'err',
  60: 'crit',
};

const resolveLevel = (pinoLevel, levelMap) => {
  if (_.isNumber(pinoLevel)) {
    if (!_.isUndefined(levelMap[pinoLevel])) {
      return levelMap[pinoLevel];
    }

    if (pinoLevel >= 60) return 'crit';
    if (pinoLevel >= 50) return 'err';
    if (pinoLevel >= 40) return 'warning';
    if (pinoLevel >= 30) return 'info';
    return 'debug';
  }

  if (_.isString(pinoLevel)) {
    return pinoLevel;
  }

  return null;
};

const createLineStream = (onLine) => {
  let buffer = '';

  return new Writable({
    decodeStrings: false,
    write(chunk, enc, cb) {
      const data = Buffer.isBuffer(chunk) ? chunk.toString('utf8') : chunk;
      buffer += data;

      const lines = buffer.split('\n');
      buffer = lines.pop();

      lines.forEach((line) => {
        if (line) {
          onLine(line);
        }
      });

      cb();
    },
    final(cb) {
      if (buffer) {
        onLine(buffer);
      }
      cb();
    },
  });
};

function buildPinoTransport(opts) {
  const transportOpts = _.clone(opts || {});
  const levelMap = transportOpts.levelMap || defaultLevelMap;

  delete transportOpts.levelMap;

  transportOpts.takeLevelFromLog = false;

  const logger = new Logger(transportOpts);
  const stream = createLineStream((line) => {
    let payload;

    try {
      payload = JSON.parse(line);
    } catch (err) {
      const parseError = new Error(`Failed to parse Pino log line: ${err.message}`);
      parseError.line = line;
      stream.emit('error', parseError);
      return;
    }

    const mappedLevel = resolveLevel(payload.level, levelMap);

    if (mappedLevel || mappedLevel === 0) {
      logger.log(mappedLevel, payload);
    } else {
      logger.log(payload);
    }
  });

  logger.on('error', (err) => stream.emit('error', err));
  stream.logger = logger;

  return stream;
}

module.exports = buildPinoTransport;
