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


test('utils safeJoin', function(t) {
  var ns1 = 'a';
  var name = 'g';
  var empty = '';
  var fullname = ns1 + '.' + name;

  t.equal(utils.safeJoin([empty, name], '.'), name);
  t.equal(utils.safeJoin([empty, empty], '.'), empty);
  t.equal(utils.safeJoin([name, empty], '.'), name);
  t.equal(utils.safeJoin([ns1, name], '.'), fullname);
  t.end();
});
