# CRUD Operations

### create

`create(input, context) => id`
saves and returns the id of the saved document.

### findOne

`findOne(filter, context) => result`
throws `NotFound` Error is no document matched the filter.

### findMany

`findMany(filter, options, context) => results`
returns an array of documents that matched the filter.
`options` can control the size of the returned results using
`options.skip` and `options.limit`

### updateOne

`updateOne(input, filter, context)`

### updateMany

`updateMany(input, filter, context)`

### removeOne

`removeOne(filter, context)`

### removeMany

`removeMany(filter, context)`

## Context

```
{
    principal, // logged in user
}
```
