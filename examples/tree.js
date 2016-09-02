'use strict';

var map = require('../lib/map').map;
var pretty = require('../lib/utils').pretty;

function Tree(parent, children, data) {
  this.parent = parent || null;
  this.children = [].concat(children || []);
  this.data = data;
}

Object.defineProperties(Tree.prototype, {
  bfsReduce: {value: bfsReduce},
  toString: {value: toString}
})

function bfsReduce(cb, initialValue) {
  var level = [this];

  while (level.length) {
    initialValue = cb(initialValue, level);
    level = level.reduce(function(nextLevel, t) {
      return nextLevel.concat(t.children);
    }, []);
  }

  return initialValue;
}

function toString() {
  return this.bfsReduce(function(result, level) {
    return result.concat(
      level.map(function(t) {
        return t.data.path;
      }).join(' | ')
    );
  }, []).join('\n');
}

function treeFactory(parent, children, data) {
  return new Tree(parent, children, data);
}

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
      name: 'B1', type: [null, 'int', 'A']
    }, {
      name: 'B2', type: {type: 'array', items: 'string'}
    }]
}];
var schemaTrees = map(schema, function(parent, entry, keyChain) {
    var t = treeFactory(parent, null, {
      path: keyChain.join('.') || 'ROOT',
      type: entry.type
    });

    ((parent || {}).children || []).push(t);

    return t;
});

console.log(schemaTrees[schemaTrees.length - 1].toString());
