'use strict';

var map = require('../lib/map').map;
var pretty = require('../lib/utils').pretty;

var schema = [{
  type: 'record',
  name: 'A',
  fields: [{
    name: 'A1', type: 'string'
  }, {
    name: 'A2', type: 'int'
  }]
}, {
  type: 'record',
  name: 'B',
  fields: [{
    name: 'B1', type: ['null', 'int', 'A']
  }, {
    name: 'B2', type: {type: 'array', items: 'string'}
  }]
}];
var flattened = [];

map(schema, function(parentValue, entry, keyChain) {
  flattened.push({
    type: entry.type,
    ref: entry.ref,
    path: keyChain.join('.'),
    parent: parentValue
  });

  return flattened[flattened.length - 1];
});

console.log(pretty(flattened));
