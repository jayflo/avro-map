'use strict';

var _ = require('lodash');

module.exports = Object.freeze({
  setKeys: setKeys,
  fromKeyValuePairs: fromKeyValuePairs,
  safeJoin: safeJoin,
  pretty: pretty
});

function pretty(value) {
  return JSON.stringify(value, null, 2);
}

function fromKeyValuePairs(kvps) {
  return kvps.reduce(function(result, tup) {
    result[tup[0]] = tup[1];
    return result;
  }, {});
}

function setKeys(obj, keys, value) {
  var useIdx = value === undefined;

  keys.forEach(function(key, idx) {
    obj[key] = useIdx ? idx + 1 : value;
  });

  return obj;
}

function safeJoin(parts, str) {
  return _.compact(parts).join(str);
}
