import { Observable } from "./Observable";
import container from "./inversify.config";
import { getParameters } from "./decorators";

export type Middleware = (
    method: string, ...args: any[]
) => Promise<any[]> | any[];


export class Service {
    private observable: Observable;
    private preMiddleware: Map<string, Middleware[]>;
    private postMiddleware: Map<string, Middleware[]>;

    constructor(observable: Observable) {
        this.observable = observable;
        this.preMiddleware = new Map();
        this.postMiddleware = new Map();
    }

    protected fire(event: string, data?: any) {
        this.observable.push(event, data);
    }

    protected async runMiddleware(middleware: Middleware[], method: string, ...args: any[]) {
        let i = 0;
        while (i < middleware.length) {
            args = await middleware[i](method, ...args);
            i++;
        }
        return args;
    }

    runPreMiddleware(method: string, ...args: any) {
        const middleware = this.preMiddleware.get(method) || [];
        return this.runMiddleware(middleware, method, ...args);
    }

    async runPostMiddleware(method: string, args: any) {
        const middleware = this.postMiddleware.get(method) || [];
        return (await this.runMiddleware(middleware, method, args))[0];
    }

    pre(methods: string | string[], middleware: Middleware) {
        if (!Array.isArray(methods)) methods = [methods];
        methods.forEach((method) => {
            const existingMiddleware = this.preMiddleware.get(method) || [];
            this.preMiddleware.set(method, [...existingMiddleware, middleware]);
        });
    }

    post(methods: string | string[], middleware: Middleware) {
        if (!Array.isArray(methods)) methods = [methods];
        methods.forEach((method) => {
            const existingMiddleware = this.postMiddleware.get(method) || [];
            this.postMiddleware.set(method, [...existingMiddleware, middleware]);
        });
    }

}

export function service() {
    return function (constructor: any) {
        const params = getParameters();
        container.bind(constructor).toConstantValue(new constructor(...params));
    }
}

export function middleware(name?: string) {
    return function (_target: any, _propertyKey: string, descriptor: PropertyDescriptor) {
        const method = descriptor.value!;

        descriptor.value = async function (...args: any[]) {
            let newArgs = await (<Service>this).runPreMiddleware(name ?? method.name, ...args);
            const result = await method.apply(this, newArgs);
            if (!result) return result;

            return (<Service>this).runPostMiddleware(name ?? method.name, result);
        }
    }
}
