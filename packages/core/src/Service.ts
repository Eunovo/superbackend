export type Middleware = (args: any) => Promise<void> | void;

export class Service {
    private preMiddleware: Map<string, Middleware[]>;
    private postMiddleware: Map<string, Middleware[]>;

    constructor() {
        this.preMiddleware = new Map();
        this.postMiddleware = new Map();
    }

    private async runMiddleware(middleware: Middleware[], args: any) {
        let i = 0;
        while (i < middleware.length) {
            await middleware[i](args);
            i++;
        }
        return args;
    }

    runPreMiddleware(method: string, args: any) {
        const middleware = this.preMiddleware.get(method) || [];
        return this.runMiddleware(middleware, args);
    }

    runPostMiddleware(method: string, args: any) {
        const middleware = this.postMiddleware.get(method) || [];
        return this.runMiddleware(middleware, args);
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
