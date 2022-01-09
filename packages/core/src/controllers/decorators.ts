import { HttpMethods } from "./BaseController";

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
