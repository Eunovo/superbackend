import { GraphQLObjectType } from "graphql";
import { CRUDService } from ".";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { extendService, Plugin } from "../Plugin";

export class CRUDPlugin extends Plugin {

    transformService(node: GraphQLObjectType, repo: Repository, service: Service) {
        const crudService = new CRUDService(node.name, repo);
        extendService(service, crudService);
        return service;
    }

}