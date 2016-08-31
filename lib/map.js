'use strict';

var _ = require('lodash');

var utils = require('./utils');
var safeJoin = utils.safeJoin;
var nameRegistry = require('./nameRegistry');
var NameRegistry = nameRegistry.NameRegistry;
var constants = require('./constants');
var PRIMITIVE_TYPES = constants.PRIMITIVE_TYPES;

module.exports = Object.freeze({
  map: map
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

function mapRecursive(
  cb, registry, namespace, typeChain, keyChain, parent, entryOrName
) {
  var representative = registry.representative(namespace, entryOrName);
  var entry = entryOrName;
  var nameDescriptor;
  var mapped;

  if (registry.isRegisterable(entryOrName)) {
    nameDescriptor = registry.add(namespace, entryOrName, {entry: entryOrName});
    typeChain = typeChain.concat(nameDescriptor.representative);
    namespace = nameDescriptor.namespace;
  }

  if (registry.has(namespace, representative)) {
    if (typeChain.indexOf(representative) !== -1)
      return;

    entry = registry.get(namespace, representative);
  } else
    throw new Error('Undefined type');

  mapped = cb(entry, keyChain.slice(0), parent, namespace);

  return getRecursables(entry).map(function(r) {
    var _keyChain = keyChain.concat(r.key || []);
    return mapRecursive(
      cb, registry, namespace, typeChain, _keyChain, mapped, r.entry
    );
  });
}

function getRecursables(entry) {
  // entry.type
}

function recordRecurse(entry) {
  return (entry.fields || []).map(function(fieldEntry) {
    return {key: fieldEntry.name, entry: fieldEntry};
  });
}

function enumRecurse() {
  return [];
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

function fixedRecurse() {
  return [];
}

function primitiveRecurse() {
  return [];
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

function isPrimitiveType(val) {
  return PRIMITIVE_TYPES.hasOwnProperty(val);
}
