'use strict';

var test = require('tape');

var utils = require('../lib/utils');

test('utils setKeys', function(t) {
  var obj = {};
  var keys = ['a', 'b', 'c'];
  var value = 1;

  utils.setKeys(obj, [], 1);

  t.equal(Object.keys(obj).length, 0);

  utils.setKeys(obj, keys, value);

  t.equal(obj.a, 1);
  t.equal(obj.b, 1);
  t.equal(obj.c, 1);
  t.equal(Object.keys(obj).length, 3);
  t.end();
});
