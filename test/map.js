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

test('map isRegisterable', function(t) {
  t.ok(map._isRegisterable(entries.record()));
  t.ok(map._isRegisterable(entries.enum()));
  t.ok(map._isRegisterable(entries.fixed()));

  t.notOk(map._isRegisterable(entries.array()));
  t.notOk(map._isRegisterable(entries.map()));
  t.notOk(map._isRegisterable(entries.union()));
  t.notOk(map._isRegisterable(entries.primitive()));
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

test('map isMapEntry', function(t) {
  t.ok(map._isMapEntry(entries.map()));

  t.notOk(map._isMapEntry(entries.record()));
  t.notOk(map._isMapEntry(entries.enum()));
  t.notOk(map._isMapEntry(entries.fixed()));
  t.notOk(map._isMapEntry(entries.array()));
  t.notOk(map._isMapEntry(entries.union()));
  t.notOk(map._isMapEntry(entries.primitive()));
  t.end();
});

test('map isArrayEntry', function(t) {
  t.ok(map._isArrayEntry(entries.array()));

  t.notOk(map._isArrayEntry(entries.map()));
  t.notOk(map._isArrayEntry(entries.record()));
  t.notOk(map._isArrayEntry(entries.enum()));
  t.notOk(map._isArrayEntry(entries.fixed()));
  t.notOk(map._isArrayEntry(entries.union()));
  t.notOk(map._isArrayEntry(entries.primitive()));
  t.end();
});

test('map isUnionEntry', function(t) {
  t.ok(map._isUnionEntry(entries.union()));

  t.notOk(map._isUnionEntry(entries.array()));
  t.notOk(map._isUnionEntry(entries.map()));
  t.notOk(map._isUnionEntry(entries.record()));
  t.notOk(map._isUnionEntry(entries.enum()));
  t.notOk(map._isUnionEntry(entries.fixed()));
  t.notOk(map._isUnionEntry(entries.primitive()));
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
