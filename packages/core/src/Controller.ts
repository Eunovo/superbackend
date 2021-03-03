import { CRUDService } from "./plugins/crud";
import { CRUD } from "./Service";

/**
 * Selects which CRUD operations to expose
 */
type Methods = { [P in CRUD]?: boolean };

const DEFAULT_METHODS: Methods = {
    create: true, read: true, update: true, delete: true
}

export class CRUDController {
    private handlers: Map<string, Handler>;

    constructor(
        public readonly route: string,
        protected service: CRUDService,
        protected methods: Methods = DEFAULT_METHODS
    ) {
        this.handlers = new Map();
        
        this.methods.read && this.get('/', this.getMany.bind(this));
        this.methods.create && this.post('/', this.create.bind(this));
        this.methods.update && this.put('/', this.updateMany.bind(this));
        this.methods.update && this.patch('/', this.updateMany.bind(this));
        this.methods.delete && this.delete('/', this.removeMany.bind(this));
    }

    async create(req: any) {
        await this.service.create(
            req.body,
            {
                principal: req.user
            }
        );

        return {
            message: 'success'
        };
    }

    async getMany(req: any) {
        const { _limit, _skip, ...filter } = req.query;

        const data = {
            results: await this.service.findMany(
                filter,
                { limit: _limit, skip: _skip },
                {
                    principal: req.user
                }
            )
        };

        return {
            message: 'success', data
        };
    }

    async updateMany(req: any) {
        const { _limit, _skip, ...filter } = req.query;

        const data = {
            results: await this.service.updateMany(
                req.body,
                filter,
                {
                    principal: req.user
                }
            )
        };

        return {
            message: 'success', data
        };
    }

    async removeMany(req: any) {
        const { _limit, _skip, ...filter } = req.query;

        const data = {
            results: await this.service.removeMany(
                filter,
                {
                    principal: req.user
                }
            )
        };

        return {
            message: 'success', data
        };
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

type HttpMethods = "post" | "get" | "put" | "patch" | "delete";

type RequestHandler = ((req: any) => any) | ((req: any) => Promise<any>);

export type Handler = {
    post?: RequestHandler
    get?: RequestHandler
    put?: RequestHandler
    patch?: RequestHandler
    delete?: RequestHandler
}
