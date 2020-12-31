import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { Models } from "../../utils";
import { Plugin } from "../Plugin";

export class AuthorizationPlugin extends Plugin {

    constructor(schema: GraphQLSchema, models: Models) {
        super(schema, models);
    }

    transformService(node: GraphQLObjectType, repo: Repository, service: Service) {
        service.pre('', async () => {});
        return service;
    }

}
