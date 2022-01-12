import { HttpMethods } from "./BaseController";
import container from "../inversify.config";
import { getParameters } from "../decorators";

let HANDLERS: any[] = [];

export function controller() {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const ControllerClass = class extends constructor {
            constructor (...args: any[]) {
                super(...args);
                HANDLERS.forEach(({ method, route, handler }) => {
                    (this as any)[method](route, handler.bind(this));
                });
                HANDLERS = [];
            }
        };

        const params = getParameters();
        const controller =  new ControllerClass(...params);
        container.bind(ControllerClass)
            .toConstantValue(controller);
        return ControllerClass;
    }
}

function createDecoratorFor(method: HttpMethods, route: string) {
    return function (target: any, propertyKey: string) {
        HANDLERS.push({ method, route, handler: target[propertyKey] });
    };
}

export function get(route: string) {
    return createDecoratorFor('get', route);
}

export function post(route: string) {
    return createDecoratorFor('post', route);
}

export function put(route: string) {
    return createDecoratorFor('put', route);
}

export function patch(route: string) {
    return createDecoratorFor('patch', route);
}

export function route(method: HttpMethods, route: string) {
    return createDecoratorFor(method, route);
}
