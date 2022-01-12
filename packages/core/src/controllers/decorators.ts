import { HttpMethods } from "./BaseController";
import container from "../inversify.config";
import { getParameters } from "../decorators";

export function controller() {
    return function (constructor: any) {
        const params = getParameters();
        const controller =  new constructor(...params);
        container.bind(constructor)
            .toConstantValue(controller)
    }
}

function createDecoratorFor(method: HttpMethods, route: string) {
    return function (target: any, propertyKey: string) {
        target[method](route, target[propertyKey].bind(target));
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
