# Authorization Plugin

This plugin provides basic access control to your models using **Role Based authorization**.  
We define roles in the `Role` enum.
```graphql
enum Role {
    USER
    ADMIN
}
```
Roles can extend other roles and inherit their authority
```graphql
enum Role {
    USER
    """@extends('USER')"""
    ADMIN
}
```
Access Control works by modifing filters and inputs to restrict the access of principals.

## Principals

A principal is a logged in user. It contains all the neccessary fields required to determine it's authority.
Access is granted to a Principal. The Principal model must have a `role: Role!` containing it's role.
All CRUD methods accept a `Context` object which may contain the principal.
```graphql
"""
@model
@principal
"""
type User {
    username: String
    role: Role!
}
```

## Defining Access Control Rules

By default, all users(including guests) are authorised to perform any action in your application.  
We can modify the authority of each role.
```graphql
"""
@model

don't allow anyone to create
@disallow('*', 'create')

allow 'USER' to create
@allow('USER', 'create')
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
@allow('ADMIN', 'create', 'read', 'update')
"""
type Test {
    """
    @allowOn('USER', false, 'create', 'read', 'update')
    """
    blocked: Boolean!
}
```

In the code snippet above, users can only perform create, read and update operations on a `Test` when `blocked = false`.  
`ADMIN` doesn't have this restriction even though it extends `USER` because it overrides
these rules by allowing create, read and update operations unconditionally on the `Test` model.

To set access control rules based on fields that should match other fields on the Principal,
define the relationship to the principal and the rule
```graphql
"""
@model
"""
type Test {
    """
    @allowOnMatch('USER', 'create', 'read', 'update', 'delete')
    @OneToOne('User', 'username')
    """
    owner: String!
}
```
Here, we define the relationship between the `User` model (the Principal) and the `Test` model.  
We allow principals to perform CRUD operations on `Test` when `test.owner = principal.username`.
**Make sure the `username` field is present in the principal**
