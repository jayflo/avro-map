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

function map(schema) {
  if (_.isString(schema)) schema = JSON.parse(schema);

  var registry = registryFactory();
  var mapped = schema.map(function(entry) {
    var parent = schema;
    var keyChain = [];
    var typeChain = [];
    var namespace = '';

    return mapRecursive(
      registry, namespace, typeChain, keyChain, parent, entry
    );
  });

  return mapped;
}

function mapRecursive(
  registry, namespace, typeChain, keyChain, parent, entryOrName
) {
  var _typeChain = typeChain;
  var _namespace = namespace;
  var nameDescriptor = registry.representative(namespace, entryOrName);
  var path = safeJoin(keyChain, '.');
  var key = _.last(keyChain) || '';

  if (registry.has(namespace, entryOrName)) {
    if (typeChain.indexOf(nameDescriptor.representative) !== -1) {
      return;
    }

    return;
  }

  if (registry.isRegisterable(entryOrName)) {
    nameDescriptor = registry.add(namespace, entryOrName);
    _typeChain = typeChain.concat(nameDescriptor.representative);
    _namespace = nameDescriptor.namespace;
  }

  return;
}

function recordRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  return (entry.fields || []).map(function(fieldEntry) {
    var childPath = keyChain.concat(fieldEntry.name);

    return mapRecursive(
      registry, namespace, typeChain, childPath, mapped, fieldEntry.type
    );
  });
}

function enumRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  return mapped;
}

function arrayRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  var childPath = keyChain.concat('$index');

  return mapRecursive(
    registry, namespace, typeChain, childPath, mapped, entry.items
  );
}

function mapRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  var childPath = keyChain.concat('$key');

  return mapRecursive(
    registry, namespace, typeChain, childPath, mapped, entry.values
  );
}

function unionRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  return entry.map(function(unionMember) {
    return mapRecursive(
      registry, namespace, typeChain, keyChain, mapped, unionMember
    );
  });
}

function fixedRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  return mapped;
}

function primitiveRecurse(
  registry, namespace, typeChain, keyChain, parent, entry, mapped
) {
  return mapped;
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
