'use strict';

var _ = require('lodash');

var COMPLEX_TYPES_NAMES = Object.freeze({
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

var COMPLEX_TYPES = Object.freeze(_.invert(COMPLEX_TYPES_NAMES));
var PRIMITIVE_TYPES = Object.freeze(_.invert(PRIMITIVE_TYPE_NAMES));

module.exports = Object.freeze({
  COMPLEX_TYPES_NAMES: COMPLEX_TYPES_NAMES,
  COMPLEX_TYPES: COMPLEX_TYPES,
  PRIMITIVE_TYPE_NAMES: PRIMITIVE_TYPE_NAMES,
  PRIMITIVE_TYPES: PRIMITIVE_TYPES
});
