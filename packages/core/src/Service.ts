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

        let obj = this;
        // TODO fix bug where middleware is not set in
        // functions called from constructor
        do {
            Object.getOwnPropertyNames(obj).forEach((key) => {
                if (!(obj as any)[key].call) return;
                const method = (obj as any)[key] as Function;
                (obj as any)[key] = async (...args: any[]) => {
                    let newArgs = await this.runPreMiddleware(method.name, ...args);
                    const result = await method.apply(this, newArgs);
                    if (!result) return;

                    return this.runPostMiddleware(method.name, result);
                };
            });

            if ((obj as any).__proto__ === Service.prototype)
                break;
        } while (obj = Object.getPrototypeOf(obj))
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