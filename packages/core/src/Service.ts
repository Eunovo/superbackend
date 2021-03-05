export type Middleware = (
    args: any, method: string, operation: any
) => Promise<void> | void;


export type Listener = (event: string, data?: any) => void;


export class Service {
    private listeners: Map<string, Listener[]>;
    private preMiddleware: Map<string, Middleware[]>;
    private postMiddleware: Map<string, Middleware[]>;

    constructor() {
        this.listeners = new Map();
        this.preMiddleware = new Map();
        this.postMiddleware = new Map();
    }

    protected fire(event: string, data?: any) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach((listener) => {
            listener(event, data);
        });
    }

    /**
     * Adds the given listener for the given event
     * @param event 
     * @param listener
     * @returns an unuscribe function to remove the listener 
     */
    listen(event: string, listener: Listener) {
        const existingListeners = this.listeners.get(event) || [];
        this.listeners.set(event, [...existingListeners, listener]);

        return () => {
            let listeners = this.listeners.get(event) || [];
            listeners = listeners.filter((item) => item !== listener);
            this.listeners.set(event, listeners);
        }
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
