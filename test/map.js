'use strict';

var test = require('tape');

var map = require('../lib/map');
var entries = require('./data/entries');
var COMPLEX_TYPE_NAMES = map.COMPLEX_TYPE_NAMES;

test('map recordRecursables', function(t) {
  var field = {name: 'a', type: 'b'};
  var entry = {fields: [field]};
  var recursables = map._recordRecursables(entry);

  t.equal(recursables.length, 1);
  t.equal(recursables[0].key, field.name);
  t.equal(recursables[0].entry, field.type);
  t.end();
});

test('map arrayRecursables', function(t) {
  var entry = {type: 'array', items: 'a'};
  var recursables = map._arrayRecursables(entry);

  t.equal(recursables.length, 1);
  t.equal(recursables[0].key, '$index');
  t.equal(recursables[0].entry, 'a');
  t.end();
});

test('map mapRecursables', function(t) {
  var entry = {type: 'map', values: 'a'};
  var recursables = map._mapRecursables(entry);

  t.equal(recursables.length, 1);
  t.equal(recursables[0].key, '$key');
  t.equal(recursables[0].entry, 'a');
  t.end();
});

test('map unionRecursables', function(t) {
  var entry = ['a'];
  var recursables = map._unionRecursables(entry);

  t.equal(recursables.length, 1);
  t.equal(recursables[0].key, '$member0');
  t.equal(recursables[0].entry, 'a');
  t.end();
});

test('map isRecursable', function(t) {
  t.ok(map._isRecursable(COMPLEX_TYPE_NAMES.RECORD));
  t.ok(map._isRecursable(COMPLEX_TYPE_NAMES.ARRAY));
  t.ok(map._isRecursable(COMPLEX_TYPE_NAMES.UNION));
  t.ok(map._isRecursable(COMPLEX_TYPE_NAMES.MAP));

  t.notOk(map._isRecursable(COMPLEX_TYPE_NAMES.FIXED));
  t.notOk(map._isRecursable(COMPLEX_TYPE_NAMES.ENUM));
  t.notOk(map._isRecursable(entries.primitive().type));
  t.end();
});

test('map isPrimitiveEntry', function(t) {
  t.ok(map._isPrimitiveEntry(entries.primitive()));

  t.notOk(map._isPrimitiveEntry(entries.array()));
  t.notOk(map._isPrimitiveEntry(entries.map()));
  t.notOk(map._isPrimitiveEntry(entries.record()));
  t.notOk(map._isPrimitiveEntry(entries.enum()));
  t.notOk(map._isPrimitiveEntry(entries.fixed()));
  t.notOk(map._isPrimitiveEntry(entries.union()));
  t.end();
});

test('map needToAddToRegistry', function(t) {
  var fullname = 'A.B.MyC';
  var namedObject = {
    name: 'MyPrimitive',
    type: entries.primitive()
  };

  t.ok(map._needToAddToRegistry(entries.record()));
  t.ok(map._needToAddToRegistry(entries.enum()));
  t.ok(map._needToAddToRegistry(entries.fixed()));
  t.ok(map._needToAddToRegistry(namedObject));

  t.notOk(map._needToAddToRegistry(fullname));
  t.notOk(map._needToAddToRegistry(entries.primitive()));
  t.notOk(map._needToAddToRegistry(entries.array()));
  t.notOk(map._needToAddToRegistry(entries.map()));
  t.notOk(map._needToAddToRegistry(entries.union()));
  t.end();
});

test('map needToGetFromRegistry', function(t) {
  var fullname = 'A.B.MyC';
  var nonPrimitiveName = 'D';
  var namedObject = {
    name: 'MyPrimitive',
    type: entries.primitive()
  };

  t.ok(map._needToGetFromRegistry(fullname));
  t.ok(map._needToGetFromRegistry(nonPrimitiveName));

  t.notOk(map._needToGetFromRegistry(entries.record()));
  t.notOk(map._needToGetFromRegistry(entries.enum()));
  t.notOk(map._needToGetFromRegistry(entries.fixed()));
  t.notOk(map._needToGetFromRegistry(namedObject));
  t.notOk(map._needToGetFromRegistry(entries.primitive()));
  t.notOk(map._needToGetFromRegistry(entries.array()));
  t.notOk(map._needToGetFromRegistry(entries.map()));
  t.notOk(map._needToGetFromRegistry(entries.union()));
  t.end();
});

test('map skipRegistry', function(t) {
  var fullname = 'A.B.MyC';
  var nonPrimitiveName = 'D';
  var namedObject = {
    name: 'MyPrimitive',
    type: entries.primitive()
  };

  t.ok(map._skipRegistry(entries.primitive()));
  t.ok(map._skipRegistry(entries.array()));
  t.ok(map._skipRegistry(entries.map()));
  t.ok(map._skipRegistry(entries.union()));

  t.notOk(map._skipRegistry(fullname));
  t.notOk(map._skipRegistry(nonPrimitiveName));
  t.notOk(map._skipRegistry(entries.record()));
  t.notOk(map._skipRegistry(entries.enum()));
  t.notOk(map._skipRegistry(entries.fixed()));
  t.notOk(map._skipRegistry(namedObject));
  t.end();
});

test('map getEntryOrNameType', function(t) {
  var primitive = entries.primitive();
  var namedObject = {
    name: 'MyPrimitive',
    type: primitive
  };
  var type = map._getEntryType;

  t.equal(type(primitive), primitive);
  t.equal(type(namedObject), primitive);
  t.equal(type(entries.array()), COMPLEX_TYPE_NAMES.ARRAY);
  t.equal(type(entries.map()), COMPLEX_TYPE_NAMES.MAP);
  t.equal(type(entries.union()), COMPLEX_TYPE_NAMES.UNION);
  t.equal(type(entries.record()), COMPLEX_TYPE_NAMES.RECORD);
  t.equal(type(entries.enum()), COMPLEX_TYPE_NAMES.ENUM);
  t.equal(type(entries.fixed()), COMPLEX_TYPE_NAMES.FIXED);
  t.end();
});
