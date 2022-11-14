import { HttpMethods } from "./BaseController";
import container from "../inversify.config";
import { getParameters } from "../decorators";
import { UnauthorisedError } from "../errors";

class Handler {

    private middleware: Function[] = [];

    constructor(
        public readonly method: HttpMethods,
        public readonly route: string,
        public readonly key: string
    ) {}

    pre(func: Function) {
        this.middleware.push(func);
    }

    getRequestFunc(rawFunc: any) {
        return (req: any) => {
            for (const func of this.middleware) {
                func(req);
            }
            return rawFunc(req);
        }
    }
}

let HANDLERS: Handler[] = [];

export function controller() {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const ControllerClass = class extends constructor {
            constructor (...args: any[]) {
                super(...args);
                HANDLERS.forEach((handler) => {
                    const rawFunc = (this as any)[handler.key].bind(this);
                    (this as any)[handler.method](
                        handler.route,
                        handler.getRequestFunc(rawFunc)
                    );
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
    return function (_target: any, propertyKey: string) {
        HANDLERS.push(new Handler(method, route, propertyKey));
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

export function requireAuth() {
    return function (_target: any, propertyKey: string) {
        const index = HANDLERS.findIndex((value) => value.key === propertyKey);
        if (index === -1) throw new Error("Not a controller function");

        const handler = HANDLERS[index];
        handler.pre((req: any) => {
            if (!req.user) {
                throw new UnauthorisedError();
            }
        });
    }
}
