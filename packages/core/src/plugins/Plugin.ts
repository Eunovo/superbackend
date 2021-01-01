import { GraphQLSchema } from "graphql";
import { Models } from "../utils";
import { Repository } from "../repositories";
import { Middleware, Service } from "../Service";
import { Model } from "../Model";

export class Plugin<T = any> {
    constructor(
        protected schema: GraphQLSchema,
        protected models: Models
    ) {};

    transformService(model: Model, repo: Repository, service: Service) {
        return service;
    };
}


export function extendService(service: Service, newService: Service) {
    function extendMap(map: Map<string, Middleware[]>, extension: Map<string, Middleware[]>) {
        extension.forEach((value, key) => {
            const middleware = map.get(key) || [];
            map.set(key, [...middleware, ...value]);
        });
    }


    Object.keys(newService)
        .forEach((name) => {
            if (name === 'preMiddleware' || name === 'postMiddleware') {
                extendMap(service[name], newService[name]);
                return;
            }
            
            Object.defineProperty(service, name, {
                value: (<any>newService)[name],
                writable: true,
                enumerable: false
            });
        });

    Object.getOwnPropertyNames(Object.getPrototypeOf(newService))
        .forEach((name) => {
            Object.defineProperty(service, name, {
                value: (<any>newService)[name],
                writable: true,
                enumerable: false
            });
        });
}
