import { GraphQLObjectType } from "graphql";
import { Repository } from "../repositories";
import { Middleware, Service } from "../Service";

export type Plugin = (node: GraphQLObjectType, repo: Repository, service: Service) => any;


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
