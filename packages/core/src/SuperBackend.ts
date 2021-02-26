import { buildSchema } from "graphql";
import { readFileSync } from "fs";
import { RepoBuilder, Repository } from "./repositories";
import { extractModelsFrom, MapAll, Models, Repositories, Services } from "./utils";
import { CRUDService, Plugin } from "./plugins";
import { Model } from "./Model";


export class SuperBackend {
    private plugins: Plugin[];
    private models: Models;
    private repos: Repositories;
    private services: MapAll<any, CRUDService>;

    constructor(private buildRepo: RepoBuilder) {
        this.plugins = [];
        this.models = {};
        this.repos = {};
        this.services = {};
    }

    /**
     * Parses the graphql schema
     * @param path to the scehma file
     */
    build(path: string) {
        const schemaString = readFileSync(path).toString();
        const gqlSchema = buildSchema(schemaString);
        this.models = extractModelsFrom(gqlSchema);

        this.plugins.forEach((plugin) => {
            plugin.setup(gqlSchema, this.models);
        });

        this.repos = Object.values(this.models)
            .reduce((prev: any, model: Model) => {
                const repo: Repository = this.buildRepo(model);
                return { ...prev, [model.name]: repo };
            }, {});

        this.services = Object.values(this.models)
            .reduce((prev: any, model: Model) => {
                return {
                    ...prev,
                    [model.name]: new CRUDService(this.repos[model.name])
                };
            }, {});

        this.applyPlugins(this.models, this.repos, this.services);

        return {
            models: this.models,
            repos: this.repos,
            services: this.services
        };
    }

    /**
     * 
     * @param name the model name
     * @param repo the new Repository
     */
    repo(name: string, repo: Repository) {
        this.repos[name] = repo;
    }

    /**
     * Applies all plugins to the given service
     * @param name the model name
     * @param service the new service
     */
    service(name: string, service: CRUDService) {
        this.services[name] = service;
        this.applyPlugins(
            { [name]: this.models[name] },
            { [name]: this.repos[name] },
            { [name]: service }
        );
    }


    plugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    private applyPlugins(models: Models, repos: Repositories, services: Services) {
        this.plugins.forEach((plugin) => {
            plugin.transformServices(models, repos, services);
        });
    }

}
