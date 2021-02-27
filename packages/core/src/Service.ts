import { MapAll } from "./utils";

export type CRUD = 'create' | 'read' | 'update' | 'delete';
export type Middleware = (
    args: any, method: string, operation: CRUD
) => Promise<void> | void;
export const CRUD_OPERATIONS: MapAll<any, CRUD> =
{
    create: 'create',
    findOne: 'read',
    findMany: 'read',
    updateOne: 'update',
    updateMany: 'update',
    removeOne: 'delete',
    removeMany: 'delete'
};


export class Service {
    private preMiddleware: Map<string, Middleware[]>;
    private postMiddleware: Map<string, Middleware[]>;

    constructor() {
        this.preMiddleware = new Map();
        this.postMiddleware = new Map();
    }

    private async runMiddleware(middleware: Middleware[], args: any, method: string) {
        let i = 0;
        while (i < middleware.length) {
            await middleware[i](args, method, CRUD_OPERATIONS[method]);
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
