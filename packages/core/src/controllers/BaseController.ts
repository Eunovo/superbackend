export class BaseController {
    private handlers: Map<string, Handler>;

    constructor(
        public readonly route: string,
    ) {
        this.handlers = new Map();
    }

    /**
     * @returns a map of routes to @type Handler
     */
    getHandlers() {
        return this.handlers;
    }

    /**
     * Tries to retrieve the request handler of the given
     * route and method.
     * @param route 
     * @param method
     * @returns `RequestHandler | undefined` 
     */
    getHandler(route: string, method: HttpMethods) {
        return this.handlers.get(route)?.[method];
    }

    post(route: string, handler: RequestHandler) {
        this.on('post', route, handler);
    }

    get(route: string, handler: RequestHandler) {
        this.on('get', route, handler);
    }

    put(route: string, handler: RequestHandler) {
        this.on('put', route, handler);
    }

    patch(route: string, handler: RequestHandler) {
        this.on('patch', route, handler);
    }

    delete(route: string, handler: RequestHandler) {
        this.on('delete', route, handler);
    }

    private on(method: HttpMethods, route: string, requestHandler: RequestHandler) {
        route = `${this.route}${route}`;
        const handler = this.handlers.get(route) || {};
        handler[method] = requestHandler;
        this.handlers.set(route, handler);
    }
}

export type HttpMethods = "post" | "get" | "put" | "patch" | "delete";

export type RequestHandler = ((req: any) => any) | ((req: any) => Promise<any>);

export type Handler = {
    post?: RequestHandler
    get?: RequestHandler
    put?: RequestHandler
    patch?: RequestHandler
    delete?: RequestHandler
}
