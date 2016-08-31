'use strict';

var test = require('tape');

var nameRegistry = require('../lib/nameRegistry');
var entries = require('./data/entries');

// var NameRegistry = nameRegistry.NameRegistry;
// var NameDescriptor = nameRegistry.NameDescriptor;
//
// function registryFactory() {
//   return new NameRegistry();
// }
//
// function descriptorFactory(un, n, r, a) {
//   return new NameDescriptor(un, n, r, a);
// }

test('nameRegistry isRegisterable', function(t) {
  t.ok(nameRegistry._isRegisterable(entries.record()));
  t.ok(nameRegistry._isRegisterable(entries.enum()));
  t.ok(nameRegistry._isRegisterable(entries.fixed()));
  t.notOk(nameRegistry._isRegisterable(entries.array()));
  t.notOk(nameRegistry._isRegisterable(entries.map()));
  t.notOk(nameRegistry._isRegisterable(entries.union()));
  t.notOk(nameRegistry._isRegisterable(entries.primitive()));
  t.end();
});

test('nameRegistry getNamespace', function(t) {
  var ns1 = 'a.b';
  var name = 'g';
  var fullname = ns1 + '.' + name;

  t.equal(nameRegistry._getNamespace(name), '');
  t.equal(nameRegistry._getNamespace(''), '');
  t.equal(nameRegistry._getNamespace(fullname), ns1);
  t.end();
});

test('nameRegistry _getUnqualifiedName', function(t) {
  var ns1 = 'a.b';
  var name = 'g';
  var fullname = ns1 + '.' + name;

  t.equal(nameRegistry._getUnqualifiedName(fullname), name);
  t.equal(nameRegistry._getUnqualifiedName(name), name);
  t.end();
});

test('nameRegistry _safeJoin', function(t) {
  var ns1 = 'a';
  var name = 'g';
  var empty = '';
  var fullname = ns1 + '.' + name;

  t.equal(nameRegistry._safeJoin([empty, name], '.'), name);
  t.equal(nameRegistry._safeJoin([empty, empty], '.'), empty);
  t.equal(nameRegistry._safeJoin([name, empty], '.'), name);
  t.equal(nameRegistry._safeJoin([ns1, name], '.'), fullname);
  t.end();
});

test('nameRegistry _isFullName', function(t) {
  var ns1 = 'a';
  var name = 'g';
  var fullname = ns1 + '.' + name;

  t.ok(nameRegistry._isFullName(fullname));
  t.notOk(nameRegistry._isFullName(name));
  t.notOk(nameRegistry._isFullName(''));
  t.end();
});

test('nameRegistry effectiveNamespace', function(t) {
  var ns1 = 'a.b';
  var ns2 = 'c.d';
  var ns3 = 'e.f';
  var name = 'g';
  var fullname = ns3 + '.' + name;

  t.equal(nameRegistry._effectiveNamespace(ns1, ns2, fullname), ns3);
  t.equal(nameRegistry._effectiveNamespace(ns1, '', fullname), ns3);
  t.equal(nameRegistry._effectiveNamespace('', ns2, fullname), ns3);
  t.equal(nameRegistry._effectiveNamespace('', '', fullname), ns3);

  t.equal(nameRegistry._effectiveNamespace(ns1, ns2, name), ns2);
  t.equal(nameRegistry._effectiveNamespace(ns1, ns2, ''), ns2);
  t.equal(nameRegistry._effectiveNamespace(ns1, '', name), ns1);
  t.equal(nameRegistry._effectiveNamespace('', ns2, name), ns2);
  t.equal(nameRegistry._effectiveNamespace(ns1, '', ''), ns1);
  t.equal(nameRegistry._effectiveNamespace('', '', name), '');
  t.equal(nameRegistry._effectiveNamespace('', ns2, ''), ns2);
  t.equal(nameRegistry._effectiveNamespace('', '', ''), '');
  t.end();
});
