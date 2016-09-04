# avro-map

1. [Install/Support](#installSupport)
2. [Documentation](#documentation)
3. [Discussion](#discussion)
4. [Example](#example)
5. [Warning](#warning)
6. [Bugs and Issues](#bugsIssues)
7. [Contributing](#contributing)

---

This package (currently) provides a single method for easily traversing an AVRO schema.  The traversal will automatically resolve all named references with their definitions.  That is, when the traversal encounters the full name `A.B.C` in the schema, it will provide the definition, e.g.

```js
{
    type: 'record',
    name: 'C',
    namespace: 'A.B'
}
```

This will allow you to easily transform the schema into data structures that may be easier to work with.  **Name resolution follows all the same rules as defined by the AVRO specification**.

# Install/Support<a name="installSupport"></a>

```sh
npm install avro-map
```

| avro-map versions | AVRO specification |
| --- | --- |
| 0.0.1-* | [1.8.1](https://avro.apache.org/docs/1.8.1/spec.html) |

# Basic Usage

Quickly build a standard n-ary tree:

```js
var map = require('avro-map').map;
var schema = getAvroSchema();
var treeFactory = getTreeFactory();
var schemaTrees = map(schema, function(parent, entry, keyChain) {
    var t = treeFactory();

    t.type = entry.type;
    t.data = collectSomeData(entry.ref, keyChain);
    t.parent = parent;
    (parent || []).children.push(t);

    return t;
});
```

# Documentation<a name="documentation"></a>

### `map(schema, callback, initialValueFn)`

**arguments**:

1. `(Object[]|String) schema`: the AVRO schema in JS Array or JSON string form;
2. `Function T callback(T parentValue, Object entry, String[] keyChain)`: executed once for every type encountered.  The return value of `map` will be the array of return values of `callback` applied to the "top level" entries of `schema`.
    1. `T parentValue`: the return value of `callback` applied to this entry's parent.
    2. `Object entry`: has the following properties:

        | key | value type | description |
        | --- | --- | --- |
        | `type` | `String` | native type e.g. `"record"`, `"string"`, etc... |
        | `ref` | `Object` | raw definition from schema |
        | `recursive` | `Boolean` | `true` when `entry` has parent with same fullname |
        | `namespace` | `String` | the current namespace |
        | `registry` | `Function(String, String)` | Signature  `Object registry(String namespace, String name)`.  Returns the *raw* schema entry for `name` in `namespace`.  A name may not exist if it is not defined or has not yet been parsed. |

        Examples:

        ```js
        { type: 'union',
          recursive: false,
          ref: ['string', 'A.B.TypeC'] }

        // or

        { type: 'fixed',
          recursive: false,
          ref: { type: 'fixed',
                   size: 16,
                   name: 'fixedSixteen' } }
        ```

        As shown, a union's type will be set to `"union"` even though a union in an AVRO schema is only the array.  We do this to standardize this argument's structure received by `callback`.
    3. `String[] keyChain`: an array of keys representing the location of this type within an object conforming to `schema`.  That is, a string is pushed onto this array for each recursive call.  The table below shows which key is added for each recursable type:

        | type | recursable properties | added to `keyChain` |
        | --- | --- | --- |
        | record | `fields[i]` | `fields[i].name` |
        | array | `items` | `"$index"`|
        | map | `values` | `"$key"` |
        | union | index `i` | `"$member" + i`

        Adding keys in this way provides a unique `keyChain` for each leaf (i.e. primitive) type in the schema.
3. `Function T initialValueFn()`: executed once for each "top level" entry in `schema` before recursing.  The return value is used as the initial `parentValue` when `callback` is applied to the top level entry.

**return**: `T[]` the return value of `callback` applied to the top level nodes of `schema`.

# Discussion<a name="discussion"></a>

avro-map can be use when one would like to traverse an AVRO schema in a depth-first search manner, e.g. build a tree.

Simply applying `Array.prototype.map` to the AVRO schema (array) has little value; each item in the array is a complex object and contains name(space)d references to previously defined types.  Hence, if one wants to map the `i`-th entry in the AVRO schema array, one must first iterate through entries `0` to `i-1`.

This is exactly what avro-map automates.  The `map` function tries to do a little as possible while still allowing one to easily traverse the entire schema as if the name(space)d references did not exist.  As each type is encountered, `map` will store/retrieve types and provide those to the callback function.  The return values of the callback are `reduce`d down each DFS branch, i.e., the return value of the callback at one schema entry is provided as an argument to the callback for each child entry.

# Example `map` execution<a name="example"></a>

Complete working example in `emaples/`.

```js
var map = require('avro-map').map;
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

Now, `flattened` "looks" like:

```js
[
    // 0
    {path: '', type: 'record', ref: schema[0], parent: undefined},
    // 1
    {path: 'A1', type: 'string', ref: {type: 'string'}, parent: flattened[0]},
    // 2
    {path: 'A2', type: 'int', ref: {type: 'int'}, parent: flattened[0]},
    // 3
    {path: '', type: 'record', ref: schema[1], parent: undefined},
    // 4
    {path: 'B1', type: 'union', ref: schema[1].fields[0].type, parent: flattened[3]},
    // 5
    {path: 'B1.$member0', type: 'null', ref: {type: 'null'}, parent: flattened[4]},
    // 6
    {path: 'B1.$member1', type: 'int', ref: {type: 'int'}, parent: flattened[4]},
    // 7
    {path: 'B1.$member2', type: 'record', ref: schema[0], parent: flattened[4]},
    // 8
    {path: 'B1.$member2.A1', type: 'string', ref: {type: 'string'}, parent: flattened[7]},
    // 9
    {path: 'B1.$member2.A2', type: 'int', ref: {type: 'int'}, parent: flattened[7]},
    // 10
    {path: 'B2', type: 'array', ref: schema[1].fields[1].type, parent: flattened[3]},
    // 11
    {path: 'B2.$index', type: 'string', ref: {type: 'string'}, parent: flattened[10]}
]
```

And `mapped` looks like:

```js
[
    // flattened[0]
    {path: '', type: 'record', ref: schema[0], parent: undefined},
    // flattened[3]
    {path: '', type: 'record', ref: schema[1], parent: undefined}
]
```

# Warning<a name="warning"></a>

avro-map is not an AVRO schema validator and it will not check that all schema entries are well defined.  Rather, avro-map's main purpose is to simply iterate through an AVRO schema while providing name resolution.  This is intentional as this project was created as a precursor to AvroJS which extends native AVRO.  For example, avro-map will happily register any schema entry with a `name` property, e.g.

```js
[{
  name: 'someName',
  type: 'string'
}, {
  type: 'array',
  items: 'someName'
}]
```

is not a valid AVRO schema but avro-map will register `someName` in the global namespace and then look it up when it recurses into `items`.

**Creating a type whose `name` is the name of an AVRO primitive will throw an error.**  Primitive names are reserved and injected into every namespace.

# Bugs/Issues<a name="bugsIssues"></a>

* Please open an Issue on the Github repo.
* Run your code with the environment variable `DEBUG=avro-map` to see extra logging.

# Contributing<a name="contributing"></a>

* No lint errors.
* No test errors.
* Add sufficient tests.
* Prefer readability to JS black magic.
