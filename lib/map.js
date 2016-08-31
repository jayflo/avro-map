'use strict';

var _ = require('lodash');

var utils = require('./utils');
var safeJoin = utils.safeJoin;
var setKeys = utils.setKeys;
var fromKeyValuePairs = utils.fromKeyValuePairs;
var nameRegistry = require('./nameRegistry').NameRegistry;

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
  [COMPLEX_TYPE_NAMES.RECORD, recordRecurse],
  [COMPLEX_TYPE_NAMES.ARRAY, arrayRecurse],
  [COMPLEX_TYPE_NAMES.MAP, mapRecurse],
  [COMPLEX_TYPE_NAMES.UNION, unionRecurse]
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

  _isRegisterable: isRegisterable,
  _isRecursable: isRecursable,
  _isMapEntry: isMapEntry,
  _isArrayEntry: isArrayEntry,
  _isUnionEntry: isUnionEntry,
  _isPrimitiveEntry:isPrimitiveEntry
});

function registryFactory() {
  return new NameRegistry();
}

function map(schema, cb) {
  if (_.isString(schema)) schema = JSON.parse(schema);

  var registry = registryFactory();

  return schema.map(function(entry) {
    var parent = schema;
    var keyChain = [];
    var typeChain = [];
    var namespace = '';

    return mapRecursive(
      cb, registry, namespace, typeChain, keyChain, parent, entry
    );
  });
}

function TypeValuePair(type, value) {
  return {type: type, value: value};
}

function mapRecursive(
  cb, registry, namespace, typeChain, keyChain, parent, entryOrName
) {
  var tvp;
  var nameDescriptor;
  var mapped;

  if (isPrimitiveEntry(entryOrName)) {
    tvp = TypeValuePair(entryOrName);
  } else if (isUnionEntry(entryOrName)) {
    tvp = TypeValuePair(COMPLEX_TYPE_NAMES.UNION, entryOrName);
  } else if (isArrayEntry(entryOrName) || isMapEntry(entryOrName)) {
    tvp = TypeValuePair(entryOrName.type, entryOrName);
  } else {
    if (isRegisterable(entryOrName)) {
      nameDescriptor = registry.add(
        namespace, entryOrName, TypeValuePair(entryOrName.type, entryOrName)
      );
      typeChain = typeChain.concat(nameDescriptor.representative);
      namespace = nameDescriptor.namespace;
    } else {
      nameDescriptor = registry.nameDescriptor(namespace, entryOrName);
    }

    if (registry.has(null, nameDescriptor.representative)) {
      if (typeChain.indexOf(nameDescriptor.representative) !== -1) {
        return;
      }

      tvp = registry.get(namespace, nameDescriptor.representative);
    } else {
      throw new Error('Undefined type: ' + entryOrName);
    }
  }

  if(!tvp) throw new Error('This is a bug');

  mapped = cb(tvp, keyChain.slice(0), parent, namespace);

  return getRecursables(entry).map(function(r) {
    var _keyChain = keyChain.concat(r.key || []);

    return mapRecursive(
      cb, registry, namespace, typeChain, _keyChain, mapped, r.entry
    );
  });
}

function getRecursables(entry) {
  var type = entry.type;

  if (isRecursable(type))
    return RECURSABLE_TYPES[type](entry.value);

  return [];
}

function recordRecurse(entry) {
  return (entry.fields || []).map(function(fieldEntry) {
    return {key: fieldEntry.name, entry: fieldEntry};
  });
}

function arrayRecurse(entry) {
  return {key: '$index', entry: entry.items};
}

function mapRecurse(entry) {
  return {key: '$key', entry: entry.values};
}

function unionRecurse(entry) {
  return entry.map(function(unionMember, idx) {
    return {key: '$member' + idx, entry: unionMember};
  });
}

// function suspendedTree(treeRoot, treeTemplate) {
//   treeRoot.suspended = true;
//   treeRoot.suspendedRef = treeTemplate;

//   return treeRoot;
// }

// function specializeTreeToPath(parent, keyChain, tree) {
//   var oldPathPrefix = new RegExp('^' + tree.path.replace(/\./g, '\\.'));
//   var newPathPrefix = safeJoin(keyChain, '.');
//   var specialized = tree.preOrderMap(function(t) {
//     var data = _.cloneDeep(_.omit(t, ['parent', 'children']));
//     var specialT = treeFactory(null, data);

//     specialT.path = newPathPrefix + specialT.path.replace(oldPathPrefix, '');

//     return specialT;
//   }, parent);

//   specialized.key = _.last(keyChain);

//   return specialized;
// }

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
