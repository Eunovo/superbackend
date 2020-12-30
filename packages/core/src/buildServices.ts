import { buildSchema, GraphQLObjectType } from "graphql";
import { readFileSync } from "fs";
import { RepoBuilder, Repository } from "./repositories";
import { extractModelsFrom } from "./utils";
import { Plugin } from "./Plugin";
import { Service } from "./Service";


/**
 * Builds CRUD services for each type in the Schema
 * 
 * @param schemaPath The path to the graphql schema
 * @param buildRepo A function to build Repositories for each model
 */
export function buildServices(
    schemaPath: string,
    buildRepo: RepoBuilder, 
    plugins: Plugin[]
) {
    const schemaString = readFileSync(schemaPath).toString();
    const gqlSchema = buildSchema(schemaString);
    const models = extractModelsFrom(gqlSchema);

    return models.reduce((prev: any, node: GraphQLObjectType) => {
        const name = node.name;
        const repo: Repository = buildRepo(node as GraphQLObjectType);

        const service = plugins.reduce((prev: Service, cur) => {
            return cur(node, repo, prev);
        }, new Service());
        
        return { ...prev, [name]: service };
    }, {});
}
