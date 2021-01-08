import { buildSchema, GraphQLObjectType } from "graphql";
import { readFileSync } from "fs";
import { RepoBuilder, Repository } from "./repositories";
import { extractModelsFrom } from "./utils";
import { Plugin } from "./plugins";
import { Service } from "./Service";
import { Model } from "./Model";


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

    const repos = Object.values(models)
        .reduce((prev: any, model: Model) => {
            const repo: Repository = buildRepo(model);
            return { ...prev, [model.name]: repo };
        }, {});

    const services = Object.values(models)
        .reduce((prev: any, model: Model) => {
            return { ...prev, [model.name]: new Service() };
        }, {});

    plugins.forEach((plugin) => {
        plugin.transformServices(models, repos, services);
    });
    
    return services;
}
