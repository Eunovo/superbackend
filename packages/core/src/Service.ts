export type Middleware = (...args: any[]) => Promise<any>;

export class Service {
    private preMiddleware: Map<string, Middleware[]>;
    private postMiddleware: Map<string, Middleware[]>;

    constructor(service?: Service) {
        this.preMiddleware = service?.preMiddleware || new Map();
        this.postMiddleware = service?.postMiddleware || new Map();
    }

    private async runMiddleware(middleware: Middleware[], ...args: any[]) {
        let i = 0;
        while (i < middleware.length) {
            if (Array.isArray(args)) args = await middleware[i](...args);
            else args = await middleware[i](args);
            i++;
        }
        return args;
    }

    runPreMiddleware(method: string, ...args: any[]) {
        const middleware = this.preMiddleware.get(method) || [];
        return this.runMiddleware(middleware, ...args);
    }

    runPostMiddleware(method: string, ...args: any[]) {
        const middleware = this.postMiddleware.get(method) || [];
        return this.runMiddleware(middleware, ...args);
    }

    pre(method: string, middleware: Middleware) {
        const existingMiddleware = this.preMiddleware.get(method) || [];
        this.preMiddleware.set(method, [...existingMiddleware, middleware]);
    }

    post(method: string, middleware: Middleware) {
        const existingMiddleware = this.postMiddleware.get(method) || [];
        this.postMiddleware.set(method, [...existingMiddleware, middleware]);
    }

}
