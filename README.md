# avro-map

This package (currently) provides a single method for traversing an AVRO schema.  The traversal will automatically populate all type names with their definitions.  That is, given a named type

```js
{
    type: 'record',
    name: 'C',
    namespace: 'A.B'
}
```

when the traversal encounters a string reference to `A.B.C`, the above object will be retrieved and passed to the mapping callback.  This will allow you to easily transform the schema into data structures that may be easier to work with.  **Name resolution follows all the same rules as defined by the AVRO specification**.

# Basic Usage

Quickly build a standard n-ary tree:

```js
var map = require('@jayflo/avro-map').map;
var schema = getAvroSchema();
var treeFactory = getTreeFactory();
var tree = map(schema, function(parent, typeObj, keyChain) {
    var t = treeFactory();

    t.type = typeObj.type;
    t.data = collectSomeData(typeObj.entry, keyChain);
    parent.children.push(t);

    return t;
}, treeFactory);
```

# Documentation

### `map(schema, cb, initialValueFn)`

**arguments**:

1. `(Object[]|String) schema`: the AVRO schema in JS Array or JSON string form;
2. `Function T cb(T parentValue, Object entry, String[] keyChain)`: executed once for every type encountered.  The return value of `map` will be the array of return values of `cb` applied to the "top level" entries of `schema`.
    1. `T parentValue`: the return value of `cb` applied to this entry's parent.
    2. `Object entry`: `entry.type` will store the native AVRO type of the entry, e.g. `string`, `record`, `array`, etc..  `entry.ref` will be a reference to the type's **raw** definition in `schema`.  Example:

        ```js
        { type: 'union',
          entry: ['string', 'A.B.TypeC'] }

        // or

        { type: 'fixed',
          entry: { type: 'fixed',
                   size: 16,
                   name: 'fixedSixteen' } }
        ```

        As shown, a union's type will be set to `"union"` even though a union in an AVRO schema is simply an array.  We do this to standardize this argument's structure received by `cb`.  When `entry.type` is a primitive, `entry.ref` will not be present.
    3. `String[] keyChain`: an array of keys representing the location of this type within an object conforming to `schema`.  That is, a string is pushed onto this array for each recursive call.  The table below shows which key is added for each recursable type:

        | recursable type | key containing recursables | add to `keyChain` |
        | --- | --- | --- |
        | record | `fields[i]` | `fields[i].name` |
        | array | `items` | `"$index"`|
        | map | `values` | `"$key"` |
        | union | index `i` | `"$member" + i`

        Adding keys in this way provides a unique `keyChain` for each leaf (i.e. primitive) type in the schema.

3. `Function T initialValueFn()`: executed once for each "top level" entry in `schema` before recursing.  The return value is used as the initial `parentValue` when `cb` is applied to the top level entry.

**return**: `T[]` the return value of `cb` applied to the top level nodes of `schema`.

# Discussion

avro-map can be use when one would like to traverse an AVRO schema in a depth-first search manner, e.g. build a tree.

Simply applying `Array.prototype.map` to the (array) AVRO schema has little value; each item in the array is a complex object and contains (string) references to previously named objects.  Moreover, we cannot treat each (top level) item in the schema as distinct since one item may define a name, while another item in the array will reference it.

avro-map's `map` function tries to do a little as possible while still allowing one to easitly traverse the entire (de-referenced) schema.  As each type is encountered, `map` will store/retrieve types and provide those to the callback.  The return values of the callback are `reduce`d down each DFS branch, i.e., the return value of each execution of the callback is provided as an argument to each of it's children.

# Example `map` execution

```js
var schema = [{
    type: 'record',
    name: 'A',
    fields: [ {name: 'A1', type: 'string'},
              {name: 'A2', type: 'int'} ]
}, {
    type: 'record',
    name: 'B',
    fields: [ {name: 'B1', type: [null, 'int', 'A']},
              {name: 'B2', type: {type: 'array', items: 'string'}} ]
}];
var flattened = [];
var mapped =
    map(schema, function(parentValue, entry, keyChain) {
        flattened.push({
            type: entry.type,
            ref: entry.ref,
            path: keyChain.join('.'),
            parent: parentValue
        });
        return flattened[flattened.length - 1];
    })
```

Now, `flattened` looks like:

```js
[
    // 0
    {type: 'record', ref: schema[0], path: '', parent: undefined},
    // 1
    {type: 'string', ref: {type: 'string'}, path: 'A1', parent: flattened[0]},
    // 2
    {type: 'int', ref: {type: 'int'}, path: 'A2', parent: flattened[0]},
    // 3
    {type: 'record', ref: schema[1], path: '', parent: undefined},
    // 4
    {type: 'union', ref: schema[1].fields[0].type, path: 'B1', parent: flattened[3]},
    // 5
    {type: 'null', ref: {type: 'null'}, path: 'B1.$member0', parent: flattened[4]},
    // 6
    {type: 'int', ref: {type: 'int'}, path: 'B1.$member1', parent: flattened[4]},
    // 7
    {type: 'record', ref: schema[0], path: 'B1.$member2', parent: flattened[4]},
    // 8
    {type: 'string', ref: {type: 'string'}, path: 'B1.$member2.A1', parent: flattened[7]},
    // 9
    {type: 'int', ref: {type: 'int'}, path: 'B1.$member2.A2', parent: flattened[7]},
    // 10
    {type: 'array', ref: schema[1].fields[1].type, path: 'B2', parent: flattened[3]},
    // 11
    {type: 'string', ref: {type: 'string'}, path: 'B2.$index', parent: flattened[10]}
]
```

And `mapped` looks like:

```js
[
    // flattened[0]
    {type: 'record', ref: schema[0], path: '', parent: undefined},
    // flattened[3]
    {type: 'record', ref: schema[1], path: '', parent: undefined}
]
```

# Contributing

* No lint errors.
* No test errors.
* Add sufficient tests.
* Prefer readability to JS black magic.
