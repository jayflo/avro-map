'use strict';

var map = require('../lib/map').map;
var pretty = require('../lib/utils').pretty;

function Tree(parent, children, data) {
  this.parent = parent || null;
  this.children = [].concat(children || []);
  this.data = data;
}

Object.defineProperties(Tree.prototype, {
  bfsForEach: {value: bfsForEach}
})

function bfsForEach(cb) {
  var level = [this];

  while (level.length) {
    cb(level);
    level = level.reduce(function(nextLevel, t) {
      return nextLevel.concat(t.children);
    }, []);
  }
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
      path: keyChain.join('.'),
      type: entry.type
    });

    ((parent || {}).children || []).push(t);

    return t;
});

schemaTrees[schemaTrees.length - 1].bfsForEach(function(level) {
  console.log(level.map(function(t) {
    return t.data.path;
  }).join(', ') + '\n');
})
