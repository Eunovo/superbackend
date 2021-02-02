# SuperBackend

Create your database and service layer from GraphQL types!  
This project is still in alpha.

## Install

On npm
`npm install -s @eunovo/superbackend`

On yarn
`yarn add @eunovo/superbackend`

## Quick Start

Define your entities in a graphql file
 ```graphql
 """
 @model
 """
 type User {
  username: String
  password: String
 }
 ```
Instantiate your backend services and repositories
```typescript
import {
    AuthorizationPlugin,
    buildMongoRepo,
    buildServices,
    CRUDPlugin,
    RelationshipPlugin,
    UsernamePasswordAuthPlugin
} from '@eunovo/superbackend';

const schemaPath = `<YOUR_GRAPHQL_FILE>`;
const { repos, services } = buildServices(schemaPath, buildMongoRepo, [
    new CRUDPlugin(),
    new RelationshipPlugin(),
    new UsernamePasswordAuthPlugin(),
    new AuthorizationPlugin()
]);

export { repos, services };
```

## [Core](https://github.com/Eunovo/athena/blob/main/packages/core/README.md)

## License
Licensed under the MIT license
