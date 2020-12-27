import { buildSchema, GraphQLObjectType } from "graphql";
import { readFileSync } from "fs";
import { CRUDService } from "./CRUDService";
import { RepoBuilder, Repository } from "./repositories";


/**
 * Builds CRUD services for each type in the Schema
 * 
 * @param schemaPath The path to the graphql schema
 * @param buildRepo A function to build Repositories for graphql schema
 */
export function buildServices(schemaPath: string, buildRepo: RepoBuilder) {
    const schemaString = readFileSync(schemaPath).toString();
    const gqlSchema = buildSchema(schemaString);

    const typeMap = gqlSchema.getTypeMap();
    return Object.keys(typeMap)
        .reduce((prev: any, key: string) => {
            const node = typeMap[key];
            if (node.astNode?.kind !== 'ObjectTypeDefinition') return prev;

            const name = node.name;
            const repo: Repository = buildRepo(node as GraphQLObjectType);
            const service = new CRUDService(name, repo);
            return { ...prev, [name]: service };
        }, {});
}
