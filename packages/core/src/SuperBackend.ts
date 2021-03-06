import { buildSchema } from "graphql";
import { readFileSync } from "fs";
import { RepoBuilder, Repository } from "./repositories";
import { extractModelsFrom, MapAll, Models, Repositories, Services } from "./utils";
import { CRUDService } from "./crud";
import { Plugin } from "./plugins";
import { Model } from "./Model";
import { CRUDController } from "./Controller";


export class SuperBackend {
    private plugins: Plugin[];
    private models: Models;
    private repos: Repositories;
    private services: MapAll<any, CRUDService>;
    private controllers: MapAll<any, CRUDController>;
    private isBuilt: boolean = false;

    constructor(private buildRepo: RepoBuilder) {
        this.plugins = [];
        this.models = {};
        this.repos = {};
        this.services = {};
        this.controllers = {};
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
                if (this.repos[model.name]) return prev;

                return { ...prev, [model.name]: repo };
            }, {});

        this.services = Object.values(this.models)
            .reduce((prev: any, model: Model) => {
                if (this.services[model.name]) return prev;

                return {
                    ...prev,
                    [model.name]: new CRUDService(this.repos[model.name])
                };
            }, {});

        this.controllers = Object.values(this.models)
            .reduce((prev: any, model: Model) => {
                let route = '';
                const restMetadata = model.metadata.find(
                    (metadata) => metadata.name === 'rest');
                route = restMetadata?.args[0];
                const methods = restMetadata?.args.slice(1)
                    .reduce(
                        (prev: any, cur: string) => ({
                            ...(prev || {}), [cur]: true
                        }),
                        undefined
                    );

                if (!route) return prev;

                return {
                    ...prev,
                    [model.name]: new CRUDController(
                        route, this.services[model.name], methods)
                };
            }, {});

        this.applyPlugins(this.models, this.repos, this.services);
        this.isBuilt = true;

        return {
            models: { ...this.models },
            repos: { ...this.repos },
            services: { ...this.services },
            controllers: { ...this.controllers }
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

        this.isBuilt && this.applyPlugins(
            { [name]: this.models[name] },
            { [name]: this.repos[name] },
            { [name]: service }
        );

        const oldController = this.controllers[name];
        if (oldController)
            this.controllers[name] = new CRUDController(
                oldController.route, service);
    }

    plugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

    private applyPlugins(models: Models, repos: Repositories, services: Services) {
        this.plugins.forEach((plugin) => {
            try {
                plugin.transformServices(models, repos, services);
            } catch (e) {
                throw new Error(`Failed to apply plugins: ${e.message}`);
            }
        });
    }

}
