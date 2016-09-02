'use strict';

var _ = require('lodash');
var debug = require('debug')('avro-map:map');

var utils = require('./utils');
var setKeys = utils.setKeys;
var pretty = utils.pretty;
var fromKeyValuePairs = utils.fromKeyValuePairs;
var NameRegistry = require('./nameRegistry').NameRegistry;

var COMPLEX_TYPE_NAMES = Object.freeze({
  RECORD: 'record',
  ENUM: 'enum',
  ARRAY: 'array',
  MAP: 'map',
  UNION: 'union',
  FIXED: 'fixed'
});

var PRIMITIVE_TYPE_NAMES = Object.freeze({
  NULL: 'null',
  BOOLEAN: 'boolean',
  INT: 'int',
  LONG: 'long',
  FLOAT: 'float',
  DOUBLE: 'double',
  BYTES: 'bytes',
  STRING: 'string'
});

var REGISTERABLE_TYPES = Object.freeze(setKeys({}, [
  COMPLEX_TYPE_NAMES.RECORD,
  COMPLEX_TYPE_NAMES.ENUM,
  COMPLEX_TYPE_NAMES.FIXED
], true));

var RECURSABLE_TYPES = Object.freeze(fromKeyValuePairs([
  [COMPLEX_TYPE_NAMES.RECORD, recordRecursables],
  [COMPLEX_TYPE_NAMES.ARRAY, arrayRecursables],
  [COMPLEX_TYPE_NAMES.MAP, mapRecursables],
  [COMPLEX_TYPE_NAMES.UNION, unionRecursables]
]));

var PRIMITIVE_TYPES = Object.freeze(_.invert(PRIMITIVE_TYPE_NAMES));

module.exports = Object.freeze({
  map: map,
  COMPLEX_TYPE_NAMES: COMPLEX_TYPE_NAMES,
  PRIMITIVE_TYPE_NAMES: PRIMITIVE_TYPE_NAMES,
  PRIMITIVE_TYPES: PRIMITIVE_TYPES,
  REGISTERABLE_TYPES: REGISTERABLE_TYPES,
  RECURSABLE_TYPES: RECURSABLE_TYPES,

  /**
   * Testing only
   */

  _getRecursables: getRecursables,
  _recordRecursables: recordRecursables,
  _arrayRecursables: arrayRecursables,
  _mapRecursables: mapRecursables,
  _unionRecursables: unionRecursables,
  _isRegisterable: isRegisterable,
  _isRecursable: isRecursable,
  _isMapEntry: isMapEntry,
  _isArrayEntry: isArrayEntry,
  _isUnionEntry: isUnionEntry,
  _isPrimitiveEntry: isPrimitiveEntry
});

function registryFactory() {
  return new NameRegistry();
}

function map(schema, cb, initialValueFn) {
  if (_.isString(schema)) schema = JSON.parse(schema);

  var registry = registryFactory();

  return schema.map(function(entry) {
    var keyChain = [];
    var typeChain = [];
    var namespace = '';
    var initialValue = (initialValueFn || _.noop)();

    return reduceEntry(
      cb, registry, namespace, typeChain, keyChain, initialValue, entry
    );
  });
}

function cbArg(type, entry) {
  return {type: type, ref: entry, recursive: false};
}

function reduceEntry(
  cb, registry, namespace, typeChain, keyChain, result, entryOrName
) {
  var tep;
  var nameDescriptor;
  var recursables = null;

  debug('start entry\n%s', pretty(entryOrName));

  if (isPrimitiveEntry(entryOrName)) {
    tep = cbArg(entryOrName, entryOrName);
  } else if (isUnionEntry(entryOrName)) {
    tep = cbArg(COMPLEX_TYPE_NAMES.UNION, entryOrName);
  } else if (isArrayEntry(entryOrName) || isMapEntry(entryOrName)) {
    tep = cbArg(entryOrName.type, entryOrName);
  } else {
    if (isRegisterable(entryOrName)) {
      nameDescriptor = registry.add(
        namespace, entryOrName, cbArg(entryOrName.type, entryOrName)
      );
    } else {
      nameDescriptor = registry.nameDescriptor(namespace, entryOrName);
    }

    if (registry.has(null, nameDescriptor.representative)) {
      tep = registry.get(namespace, nameDescriptor.representative);

      if (typeChain.indexOf(nameDescriptor.representative) !== -1) {
        tep.recursive = true;
        recursables = [];
      }

      typeChain = typeChain.concat(nameDescriptor.representative);
      namespace = nameDescriptor.namespace;
    } else {
      throw new Error('Undefined type: ' + entryOrName);
    }
  }

  if (!tep) throw new Error('This is a bug');

  result = cb(result, tep, keyChain.slice(0));
  recursables = recursables || getRecursables(tep);
  debug('recursables\n%s', pretty(recursables));

  recursables.forEach(function(r) {
    var _keyChain = keyChain.concat(r.key || []);

    reduceEntry(
      cb, registry, namespace, typeChain, _keyChain, result, r.entry
    );
  });

  debug('end\n%s', pretty(entryOrName));

  return result;
}

function getRecursables(tep) {
  var type = tep.type;

  if (isRecursable(type)) {
    debug('Recursable type: %s', type);
    return RECURSABLE_TYPES[type](tep.ref);
  }

  debug('Non-recursable type: %s', type);

  return [];
}

function recordRecursables(entry) {
  return (entry.fields || []).map(function(fieldEntry) {
    return {key: fieldEntry.name, entry: fieldEntry.type};
  });
}

function arrayRecursables(entry) {
  return [{key: '$index', entry: entry.items}];
}

function mapRecursables(entry) {
  return [{key: '$key', entry: entry.values}];
}

function unionRecursables(entry) {
  return entry.map(function(unionMember, idx) {
    return {key: '$member' + idx, entry: unionMember};
  });
}

function isMapEntry(value) {
  return _.isPlainObject(value) && value.type === COMPLEX_TYPE_NAMES.MAP;
}

function isArrayEntry(value) {
  return _.isPlainObject(value) && value.type === COMPLEX_TYPE_NAMES.ARRAY;
}

function isUnionEntry(value) {
  return Array.isArray(value);
}

function isPrimitiveEntry(value) {
  return Boolean(PRIMITIVE_TYPES[value]);
}

function isRecursable(type) {
  return Boolean(RECURSABLE_TYPES[type]);
}

function isRegisterable(value) {
  return _.isPlainObject(value) && REGISTERABLE_TYPES[value.type];
}
