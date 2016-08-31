'use strict';

var _ = require('lodash');

var constants = require('../../lib/constants');
var PRIMITIVE_TYPE_NAMES = constants.PRIMITIVE_TYPE_NAMES;
var primitiveTypeArray = Object.keys(PRIMITIVE_TYPE_NAMES);

module.exports = Object.freeze({
  record: function(obj) {
    return _.assign({
      type: 'record',
      name: 'LongList',
      aliases: ['LinkedLongs'],
      doc: 'doc string',
      fields: [
        {name: 'value', type: 'long'},
        {name: 'next', type: ['null', 'LongList']}
      ]
    }, obj);
  },
  enum: function(obj) {
    return _.assign({
      type: 'enum',
      name: 'MyEnum',
      aliases: ['EnumAgain'],
      doc: 'doc string',
      symbols: ['a', 'b', 'c']
    }, obj);
  },
  array: function(obj) {
    return _.assign({
      type: 'array',
      items: 'string'
    }, obj);
  },
  map: function(obj) {
    return _.assign({
      type: 'map',
      items: 'string'
    }, obj);
  },
  union: function(obj) {
    return ['int', 'string'];
  },
  fixed: function(obj) {
    return _.assign({
      name: 'myFixed',
      aliases: ['anotherFixed'],
      type: 'fixed',
      size: 16
    }, obj);
  },
  primitive: function(s) {
    return s || PRIMITIVE_TYPE_NAMES[
      primitiveTypeArray[_.random(primitiveTypeArray.length)]
    ];
  }
});
