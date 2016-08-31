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
  var mapped = schema.map(function(entry) {
    var parent = schema;
    var keyChain = [];
    var typeChain = [];
    var namespace = '';

    return mapRecursive(
      cb, registry, namespace, typeChain, keyChain, parent, entry
    );
  });

  return mapped;
}

function mapRecursive(
  cb, registry, namespace, typeChain, keyChain, parent, entryOrName
) {
  var representative = registry.representative(namespace, entryOrName);
  var nameDescriptor;
  var entry;
  var mapped;
  var recursables;

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
  recursables = getRecursables(entry.type)(keyChain.slice(0), entry);

  return recursables.map(function(r) {
    return mapRecursive(
      cb, registry, namespace, typeChain, r.keyChain, mapped, r.entry
    );
  });
}

function getRecursables(type) {

}

function recordRecurse(keyChain, entry) {
  return (entry.fields || []).map(function(fieldEntry) {
    var childPath = keyChain.concat(fieldEntry.name);

    return {keyChain: childPath, entry: fieldEntry};
  });
}

function enumRecurse() {
  return [];
}

function arrayRecurse(keyChain, entry) {
  var childPath = keyChain.concat('$index');

  return {keyChain: childPath, entry: entry.items};
}

function mapRecurse(keyChain, entry) {
  var childPath = keyChain.concat('$key');

  return {keyChain: childPath, entry: entry.values};
}

function unionRecurse(keyChain, record) {
  return entry.map(function(unionMember) {
    return {keyChain: keyChain.slice(0), entry: unionMember};
  });
}

function fixedRecurse(keyChain, record) {
  return [];
}

function primitiveRecurse(keyChain, record) {
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
