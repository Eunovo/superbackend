# Authorization Plugin

This plugin provides access control to your app using **Role Based Authorization** and **Attribute Based Authorization**.  
Roles and action attributes are used to determine user access rules. 
We define roles in the `Role` enum.
```graphql
enum Role {
    user
    admin
}
```
Roles can extend other roles and inherit their authority
```graphql
enum Role {
    user
    """@extends('user')"""
    admin
}
```
**Note that roles are case insensitive**
We can also define attributes while .

## Principals

A principal is a logged in user. It contains all the neccessary fields required to determine it's authority.
Access is usually granted to a Principal. All CRUD methods accept a `Context` object which may contain the principal.


## Defining Access Control Rules

By default, all users(including guests) are denied access in your application.  

We use the annotations
 - `@allow(<Role>, <Group>, <any number of Operations>)` Grant access to specified role and group for the specified operations 
 - `@deny(<Role>, <Group>, <any number of Operations>)` Deny access to specified role and group for the specified operations

We can modify the authority of each role.
```graphql
"""
@model

don't allow anyone to create
@deny('*', '*', 'create')

allow all 'user's to create
@allow('user', '*', 'create')
"""
type Test {

}
```
**Note** here that `ADMIN` can also create `Test` because `ADMIN extends USER`,
therefore any access control rule applied to `USER` is inherited by `ADMIN`.  
**Also note that `ADMIN` can override inherited access control rules.**

To set access control rules based on field values, define rules on the fields.
```graphql
"""
@model
@deny('*', '*', 'update', 'delete')
@allow('admin', '*', 'read', 'update')
"""
type Test {
    """
    Grant access to a user who is an owner
    when the subject matches author
    for 'create' and 'update'
    
    @allow('user', 'owner', 'create', 'update')
    """
    author: String;
    """
    Deny access to all users for 'read' when
    subject exists in the blocked array 
    
    @deny('user', '*' , 'read')
    """
    blocked: [String]
}
```
```javascript

// Here, the username of the principal is the 'subject'

services.User.pre(
    ['create', 'updateOne', 'updateMany'],
    (args, _method, operation) => {
        const { username, role } = args.context.principal ||
            { username: '', role: '' };
        const { input } = args;

        const grants = args.context.grants.match(role, {
            'user': username === input.author && 'owner'
        }).authorize(operation);
        grants.inputs(input, username);
    }
);

services.User.pre(
    [
        'findOne', 'findMany', 'updateOne',
        'updateMany', 'removeOne', 'removeMany'
    ],
    (args, _method, operation) => {
        const { username, role } = args.context.principal ||
            { username: '', role: '' };
        const { filter } = args;
        args.filter = args.context.grants.match(
            role, { 'user': filter.author === username && 'owner' }
        ).authorize(operation)
            .filter(filter, username);
    }
);
```
