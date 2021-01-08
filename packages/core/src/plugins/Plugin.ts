import { Models, Repositories, Services } from "../utils";
import { Middleware, Service } from "../Service";
import { GraphQLSchema } from "graphql";


export abstract class Plugin<T = any> {

    setup(schema: GraphQLSchema, models: Models) {}

    abstract transformServices(models: Models, repos: Repositories, services: Services): void

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
