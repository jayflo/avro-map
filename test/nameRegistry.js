'use strict';

var test = require('tape');

var nameRegistry = require('../lib/nameRegistry');
var NameRegistry = nameRegistry.NameRegistry;
var entries = require('./data/entries');

function registryFactory() {
  return new NameRegistry();
}

test('NameRegistry constructor', function(t) {
  registryFactory();
  t.end();
});

test('NameRegistry throws', function(t) {
  var r = registryFactory();
  var namespace = 'a';
  var entry = {
    namespace: 'b',
    aliases: ['c']
  };

  t.throws(function() {
    r.add(null, entry, 1)
  }, Error);
  t.throws(function() {
    r.add(namespace, entry, 1)
  }, Error);
  t.end();
});

test('NameRegistry simple name, no namespaces', function(t) {
  var r = registryFactory();
  var entry = {
    name: 'a',
    aliases: ['b']
  };

  r.add(null, entry, 1);

  t.ok(r.has(null, entry));
  t.ok(r.has(null, 'a'));
  t.ok(r.has(null, 'b'));
  t.end();
});

test('NameRegistry simple name with namespace', function(t) {
  var entry = {
    name: 'a',
    namespace: 'b',
    aliases: ['c']
  };
  var enclosingNamespace = 'd';

  [null, enclosingNamespace].forEach(function(en) {
    var r = registryFactory();

    r.add(en, entry, 1);

    t.ok(r.has(en, entry));
    t.ok(r.has(en, 'b.a'));
    t.ok(r.has(en, 'b.c'));
    t.notOk(r.has(en, 'a'));
    t.notOk(r.has(en, 'c'));
    t.notOk(r.has(en, 'd.a'));
    t.notOk(r.has(en, 'd.b'));
  });
  t.end();
});

test('NameRegistry simple name with enclosingNamespace', function(t) {
  var r = registryFactory();
  var entry = {
    name: 'a',
    aliases: ['b']
  };
  var enclosingNamespace = 'c';

  r.add(enclosingNamespace, entry, 1);

  t.ok(r.has(enclosingNamespace, entry));
  t.ok(r.has(enclosingNamespace, 'a'));
  t.ok(r.has(enclosingNamespace, 'b'));
  t.ok(r.has(null, 'c.a'));
  t.ok(r.has(null, 'c.b'));
  t.notOk(r.has(null, entry));
  t.notOk(r.has(null, 'a'));
  t.notOk(r.has(null, 'b'));
  t.end();
});

test('NameRegistry fullname', function(t) {
  var entry = {
    name: 'a.b',
    aliases: ['c']
  };
  var enclosingNamespace = 'e';

  [null, enclosingNamespace].forEach(function(en) {
    var r = registryFactory();

    r.add(en, entry, 1);

    t.ok(r.has(en, entry));
    t.ok(r.has(en, 'a.b'));
    t.ok(r.has(en, 'a.c'));
    t.notOk(r.has(en, 'b'));
    t.notOk(r.has(en, 'c'));
  });
  t.end();
});

test('NameRegistry fullname with namespace', function(t) {
  var entry = {
    name: 'a.b',
    namespace: 'c',
    aliases: ['d']
  };
  var enclosingNamespace = 'e';

  [null, enclosingNamespace].forEach(function(en) {
    var r = registryFactory();

    r.add(en, entry, 1);

    t.ok(r.has(en, entry));
    t.ok(r.has(en, 'a.b'));
    t.ok(r.has(en, 'a.d'));
    t.notOk(r.has(en, 'b'));
    t.notOk(r.has(en, 'd'));
    t.notOk(r.has(en, 'c.b'));
    t.notOk(r.has(en, 'c.d'));
  });
  t.end();
});

test('nameDescriptor simple name, no namespace', function(t) {
  var entry = {
    name: 'a',
    aliases: ['b']
  };
  var nd = NameRegistry.nameDescriptor(null, entry);

  t.equal(nd.representative, 'a');
  t.equal(nd.namespace, '');
  t.equal(nd.unqualifiedName, 'a');
  t.ok(nd.aliases.indexOf('a') + 1);
  t.ok(nd.aliases.indexOf('b') + 1);
  t.end();
});

test('nameDescriptor simple name, namespace', function(t) {
  var entry = {
    name: 'a',
    namespace: 'b',
    aliases: ['c']
  };
  var enclosingNamespace = 'd';

  [null, enclosingNamespace].forEach(function(en) {
    var nd = NameRegistry.nameDescriptor(en, entry);

    t.equal(nd.representative, 'b.a');
    t.equal(nd.namespace, 'b');
    t.equal(nd.unqualifiedName, 'a');
    t.ok(nd.aliases.indexOf('b.a') + 1);
    t.ok(nd.aliases.indexOf('b.c') + 1);
  });
  t.end();
});

test('nameDescriptor full name', function(t) {
  var entry = {
    name: 'a.b',
    namespace: 'c',
    aliases: ['d']
  };
  var enclosingNamespace = 'e';

  [null, enclosingNamespace].forEach(function(en) {
    var nd = NameRegistry.nameDescriptor(en, entry);

    t.equal(nd.representative, 'a.b');
    t.equal(nd.namespace, 'a');
    t.equal(nd.unqualifiedName, 'b');
    t.ok(nd.aliases.indexOf('a.b') + 1);
    t.ok(nd.aliases.indexOf('a.d') + 1);
  });
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

test('nameRegistry getUnqualifiedName', function(t) {
  var ns1 = 'a.b';
  var name = 'g';
  var fullname = ns1 + '.' + name;

  t.equal(nameRegistry._getUnqualifiedName(fullname), name);
  t.equal(nameRegistry._getUnqualifiedName(name), name);
  t.end();
});

test('nameRegistry isFullName', function(t) {
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
