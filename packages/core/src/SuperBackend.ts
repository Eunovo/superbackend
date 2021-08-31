import { buildSchema, GraphQLSchema } from "graphql";
import { readFileSync } from "fs";
import { RepoBuilder, Repository } from "./repositories";
import { extractModelsFrom, MapAll, Models, Repositories, Services } from "./utils";
import { CRUDService } from "./crud";
import { Plugin } from "./plugins";
import { Model } from "./Model";
import { CRUDController } from "./controllers/CRUDController";
import { Observable } from "./Observable";


export class SuperBackend {
    private observable: Observable;
    private plugins: Plugin[];

    constructor(private buildRepo: RepoBuilder) {
        this.plugins = [];
        this.observable = new Observable();
    }

    applyPlugins(models: Models, repos: Repositories, services: Services) {
        this.plugins.forEach((plugin) => {
            try {
                plugin.transformServices(models, repos, services);
            } catch (e: any) {
                throw new Error(`Failed to apply plugins: ${e.message}`);
            }
        });
    }

    buildModels(path: string) {
        const schemaString = readFileSync(path).toString();
        const gqlSchema = buildSchema(schemaString);
        const models = extractModelsFrom(gqlSchema);

        this.plugins.forEach((plugin) => {
            plugin.setup(gqlSchema, models);
        });

        return { models: models, schema: gqlSchema }
    }

    buildRepos(models: MapAll<any, Model>) {
        const allowsCrud = (model: Model) => {
            const meta = model.metadata
                .find((meta) =>
                    meta.name === 'model' &&
                    (meta.args.length === 0 || meta.args[0])
                );
            return meta ? true : false;
        }

        const repos = Object.values(models)
            .filter((model) => allowsCrud(model))
            .reduce((prev: any, model: Model) => {
                const repo: Repository = this.buildRepo(model);
                return { ...prev, [model.name]: repo };
            }, { });

        return { repos };
    }

    buildServices(
        models: MapAll<any, Model>,
        repos: MapAll<any, Repository | undefined>
    ) {
        const services = Object.values(models)
            .reduce((prev: any, model: Model) => {
                const repo = repos[model.name];
                if (!repo) return prev;

                return {
                    ...prev,
                    [model.name]: new CRUDService(
                        this.observable.getObservableFor(model.name.toLowerCase()),
                        repo
                    )
                };
            }, { });

        return { services };
    }

    buildControllers(
        models: MapAll<any, Model>,
        services: MapAll<any, CRUDService | undefined>,
    ) {
        const controllers = Object.values(models)
            .reduce((prev: any, model: Model) => {
                let route = '';
                const restMetadata = model.metadata.find(
                    (metadata) => metadata.name === 'rest');
                route = restMetadata?.args[0];
                const methods = restMetadata?.args.slice(1)
                    .reduce(
                        (prev: any, cur: string) => ({
                            ...(prev || { }), [cur]: true
                        }),
                        undefined
                    );
                const service = services[model.name];

                if (!route || !service) return prev;

                return {
                    ...prev,
                    [model.name]: new CRUDController(
                        route, service, methods)
                };
            }, { });

        return { controllers };
    }

    /**
     * Parses the graphql schema
     * @param path to the scehma file
     */
    build(path: string) {
        const { models } = this.buildModels(path);
        const { repos } = this.buildRepos(models);
        const { services } = this.buildServices(models, repos);
        const { controllers } = this.buildControllers(models, services);

        this.applyPlugins(models, repos, services);

        return {
            models, repos, services, controllers
        };
    }

    getObservable() {
        return this.observable;
    }

    plugin(plugin: Plugin) {
        this.plugins.push(plugin);
    }

}
