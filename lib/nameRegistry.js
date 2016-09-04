'use strict';

var _ = require('lodash');
var debug = require('debug')('avro-map:nameRegistry');

var utils = require('./utils');
var setKeys = utils.setKeys;
var safeJoin = utils.safeJoin;
var pretty = utils.pretty;

module.exports = Object.freeze({
  NameRegistry: NameRegistry,

  /**
   * Testing only
   */

  _effectiveNamespace: effectiveNamespace,
  _getNamespace: getNamespace,
  _getUnqualifiedName: getUnqualifiedName,
  _isFullName: isFullName
});

function NameRegistry(invalidUnqualifiedNames) {
  this._invalidUnqualifiedNames = setKeys(
    {}, invalidUnqualifiedNames || [], true
  );
  this._values = {};
  this._representatives = {};
}

NameRegistry.nameDescriptor = createNameDescriptor;

Object.defineProperties(NameRegistry.prototype, {
  add: {value: add},
  get: {value: get},
  has: {value: has},
  invalidNames: {value: invalidNames},
  nameDescriptor: {value: NameRegistry.nameDescriptor}
});

function add(enclosingNamespace, entry, value) {
  if (!_.isPlainObject(entry) || !_.isString(entry.name))
    throw new Error('nameRegistry add error');

  var nd = createNameDescriptor(enclosingNamespace, entry);
  var representative = nd.representative;
  var badNames = this.invalidNames(nd.aliases).join(', ');

  if (badNames)
    throw new Error('Attempting to register invalid names %s.', badNames);

  debug('adding name\n%s', pretty(nd));
  setKeys(this._representatives, nd.aliases, representative);
  this._values[representative] = value;

  return nd;
}

function get(enclosingNamespace, entryOrName) {
  var nd = createNameDescriptor(enclosingNamespace, entryOrName);

  return this._values[this._representatives[(nd || {}).representative]];
}

function has(enclosingNamespace, entryOrName) {
  return Boolean(this.get(enclosingNamespace, entryOrName));
}

function invalidNames(nameArray) {
  var invalidNames = this._invalidUnqualifiedNames;

  return nameArray
    .map(getUnqualifiedName)
    .filter(function(name) {
      return invalidNames[name];
    });
}

function NameDescriptor(un, n, r, a) {
  this.unqualifiedName = un || '';
  this.namespace = n || '';
  this.representative = r || '';
  this.aliases = a || '';
  Object.freeze(this);
}

function createNameDescriptor(enclosingNamespace, entryOrName) {
  if (_.isPlainObject(entryOrName))
    return nameDescriptorFromEntry(enclosingNamespace, entryOrName);
  else if (_.isString(entryOrName))
    return nameDescriptorFromName(enclosingNamespace, entryOrName);
}

function nameDescriptorFromEntry(enclosingNamespace, entry) {
  var d = entry || {};
  var unqualifiedName = getUnqualifiedName(d.name);
  var namespace = effectiveNamespace(enclosingNamespace, d.namespace, d.name);
  var representative = safeJoin([namespace, unqualifiedName], '.');
  var aliases = [representative].concat(
    (d.aliases || []).map(function(alias) {
      return isFullName(alias) ? alias : safeJoin([namespace, alias], '.');
    })
  );

  return new NameDescriptor(
    unqualifiedName, namespace, representative, aliases
  );
}

function nameDescriptorFromName(enclosingNamespace, name) {
  var unqualifiedName = getUnqualifiedName(name);
  var namespace = effectiveNamespace(enclosingNamespace, null, name);
  var representative = safeJoin([namespace, unqualifiedName], '.');
  var aliases = [representative];

  return new NameDescriptor(
    unqualifiedName, namespace, representative, aliases
  );
}

function effectiveNamespace(enclosingNamespace, namespace, name) {
  return isFullName(name) ?
  getNamespace(name) :
  namespace || enclosingNamespace || '';
}

function getNamespace(str) {
  return _.initial((str || '').split('.')).join('.');
}

function getUnqualifiedName(str) {
  return _.last((str || '').split('.'));
}

function isFullName(str) {
  return _.isString(str) && str.indexOf('.') !== -1;
}
