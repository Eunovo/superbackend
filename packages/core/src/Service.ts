import { Observable } from "./Observable";

export type Middleware = (
    args: any, method: string, operation: any
) => Promise<void> | void;


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

    protected async runMiddleware(middleware: Middleware[], args: any, method: string) {
        let i = 0;
        while (i < middleware.length) {
            await middleware[i](args, method, method);
            i++;
        }
        return args;
    }

    runPreMiddleware(method: string, args: any) {
        const middleware = this.preMiddleware.get(method) || [];
        return this.runMiddleware(middleware, args, method);
    }

    runPostMiddleware(method: string, args: any) {
        const middleware = this.postMiddleware.get(method) || [];
        return this.runMiddleware(middleware, args, method);
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
