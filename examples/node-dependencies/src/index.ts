import debug = require('debug');
import arrify = require('arrify');
import isObject = require('isobject');

const logger = debug('app');
export function log(format: string, args: unknown) {
  logger(format, ...arrify(args))
}