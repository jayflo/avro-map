'use strict';

var _ = require('lodash');
var debug = require('debug')('avro-map:map');

var utils = require('./utils');
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
  RECURSABLE_TYPES: RECURSABLE_TYPES,

  /**
   * Testing only
   */

  _isRecursable: isRecursable,
  _getRecursables: getRecursables,
  _recordRecursables: recordRecursables,
  _arrayRecursables: arrayRecursables,
  _mapRecursables: mapRecursables,
  _unionRecursables: unionRecursables,
  _isPrimitiveEntry: isPrimitiveEntry,
  _needToAddToRegistry: needToAddToRegistry,
  _needToGetFromRegistry: needToGetFromRegistry,
  _skipRegistry: skipRegistry,
  _getEntryType: getEntryType
});

function registryFactory() {
  var invalidUnqualifiedNames = _.values(PRIMITIVE_TYPE_NAMES);

  return new NameRegistry(invalidUnqualifiedNames);
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

function reduceEntry(
  cb, registry, namespace, typeChain, keyChain, result, entryOrName
) {
  var recursables = null;
  var nameDescriptor;
  var entry;
  var cbArg;

  debug('start entry\n%s', pretty(entryOrName));

  if (skipRegistry(entryOrName)) {
    debug('skipping registry');
    cbArg = makeCbArg(registry, namespace, entryOrName);
  } else {
    if (needToAddToRegistry(entryOrName)) {
      debug('Adding %s to registry', entryOrName);
      nameDescriptor = registry.add(namespace, entryOrName, entryOrName);
    } else {
      debug('adding or getting from registry');
      nameDescriptor = registry.nameDescriptor(namespace, entryOrName);
    }

    if (registry.has(null, nameDescriptor.representative)) {
      debug('success');
      entry = registry.get(namespace, nameDescriptor.representative);
      cbArg = makeCbArg(registry, namespace, entry);

      if (typeChain.indexOf(nameDescriptor.representative) !== -1) {
        debug('this is a recursive type');
        cbArg.recursive = true;
      }

      typeChain = typeChain.concat(nameDescriptor.representative);
      namespace = nameDescriptor.namespace;
    } else
      throw new Error('Undefined type: ' + entryOrName);
  }

  recursables = getRecursables(cbArg);
  debug('recursables\n%s', pretty(recursables));
  result = cb(result, cbArg, keyChain.slice(0));
  debug('cb result\n%s', result);
  recursables.forEach(function(r) {
    var _keyChain = keyChain.concat(r.key || []);

    reduceEntry(
      cb, registry, namespace, typeChain, _keyChain, result, r.entry
    );
  });

  debug('end\n%s', pretty(entryOrName));

  return result;
}

function needToAddToRegistry(entryOrName) {
  return _.isPlainObject(entryOrName) && _.isString(entryOrName.name);
}

function needToGetFromRegistry(entryOrName) {
  return _.isString(entryOrName) && !isPrimitiveEntry(entryOrName);
}

function skipRegistry(entryOrName) {
  return !needToAddToRegistry(entryOrName) &&
         !needToGetFromRegistry(entryOrName);
}

function makeCbArg(registry, namespace, entry) {
  return Object.freeze({
    registry: registry.get,
    namespace: namespace,
    type: getEntryType(entry),
    ref: entry,
    recursive: false
  });
}

function getEntryType(entryOrName) {
  if (_.isString(entryOrName))
    return entryOrName;
  if (_.isArray(entryOrName))
    return COMPLEX_TYPE_NAMES.UNION;
  if (_.isPlainObject(entryOrName))
    return entryOrName.type;

  throw new Error('Cannot determine type: ' + entryOrName);
}

function getRecursables(cbArg) {
  var recursive = cbArg.recursive;
  var type = cbArg.type;

  if (recursive) {
    debug('Recursive type: %s', type);
    return [];
  } else if (isRecursable(type)) {
    debug('Recursable type: %s', type);
    return RECURSABLE_TYPES[type](cbArg.ref);
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

function isPrimitiveEntry(value) {
  return Boolean(PRIMITIVE_TYPES[value]);
}

function isRecursable(type) {
  return Boolean(RECURSABLE_TYPES[type]);
}
