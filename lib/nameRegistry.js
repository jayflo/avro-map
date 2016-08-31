'use strict';

var _ = require('lodash');

var utils = require('./utils');
var setKeys = utils.setKeys;
var safeJoin = utils.safeJoin;

module.exports = Object.freeze({
  NameRegistry: NameRegistry,
  NameDescriptor: NameDescriptor,

  /**
   * Testing only
   */

  _effectiveNamespace: effectiveNamespace,
  _getNamespace: getNamespace,
  _getUnqualifiedName: getUnqualifiedName,
  _isFullName: isFullName
});

function NameRegistry() {
  this._values = {};
  this._representatives = {};
}

Object.defineProperties(NameRegistry.prototype, {
  add: {value: add},
  get: {value: get},
  has: {value: has},
  nameDescriptor: {value: nameDescriptor}
});

function add(enclosingNamespace, entry, value) {
  var nd = NameDescriptor.create(enclosingNamespace, entry);
  var representative = nd.representative;

  if (!nd.representative) throw new Error();

  setKeys(this._representatives, nd.aliases, representative);
  this._values[representative] = value;

  return nd;
}

function get(enclosingNamespace, entryOrName) {
  var nd = NameDescriptor.create(enclosingNamespace, entryOrName);

  return this._values[this._representatives[(nd || {}).representative]];
}

function has(enclosingNamespace, entryOrName) {
  return _.toBoolean(this.get(enclosingNamespace, entryOrName));
}

function nameDescriptor(enclosingNamespace, entryOrName) {
  return NameDescriptor.create(enclosingNamespace, entryOrName);
}

function NameDescriptor(un, n, r, a) {
  this.unqualifiedName = un || '';
  this.namespace = n || '';
  this.representative = r || '';
  this.aliases = a || '';
  Object.freeze(this);
}

Object.defineProperties(NameDescriptor.prototype, {
  fromEntry: {value: fromEntry},
  fromName: {value: fromName},
  create: {value: create}
});

function create(enclosingNamespace, entryOrName) {
  if (_.isPlainObject(entryOrName))
    return NameDescriptor.fromEntry(enclosingNamespace, entryOrName);
  else if (_.isString(entryOrName))
    return NameDescriptor.fromName(enclosingNamespace, entryOrName);
}

function fromEntry(enclosingNamespace, entry) {
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

function fromName(enclosingNamespace, name) {
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
