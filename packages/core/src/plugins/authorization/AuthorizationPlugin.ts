import { GraphQLObjectType, GraphQLSchema } from "graphql";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { Plugin } from "../Plugin";

export class AuthorizationPlugin extends Plugin {

    constructor(protected schema: GraphQLSchema) {
        super(schema);
    }

    transformService(node: GraphQLObjectType, repo: Repository, service: Service) {
        service.pre('', async () => {});
        return service;
    }

}
