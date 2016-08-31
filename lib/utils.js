'use strict';

module.exports = Object.freeze({
  setKeys: setKeys,
  safeJoin: safeJoin
});

function setKeys(obj, keys, value) {
  keys.forEach(function(key) {
    obj[key] = value;
  });

  return obj;
}

function safeJoin(parts, str) {
  return _.compact(parts).join(str);
}
