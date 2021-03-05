import { FilterOptions, Repository } from "../repositories";
import { Service } from "../Service";
import { CRUD_OPERATIONS, CRUDMiddleware } from "./CRUDOps";


export class CRUDService extends Service {

    constructor(
        protected repo: Repository
    ) { super() }

    async create(input: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'create', { context, input });
        
        input = args.input;
        const id = await this.repo.create(input);
        args = await this.runPostMiddleware(
            'create', { ...args, id });
        
        return args.id;
    }

    async findOne(filter: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'findOne', { context, filter });
        filter = args.filter;

        const result = await this.repo.findOne(filter);
        if (!result) throw new Error('Not Found');

        args = await this.runPostMiddleware(
            'findOne', { ...args, result });

        return args.result;
    }

    async findMany(filter: any, options?: FilterOptions, context: any = {}) {
        let args = await this.runPreMiddleware(
            'findMany', { context, filter, options });
        filter = args.filter;
        options = args.options;

        const results = await this.repo.findMany(filter, options);
        args = await this.runPostMiddleware(
            'findMany', { ...args, results });

        return args.results;
    }

    async updateOne(input: any, filter: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'updateOne', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        await this.repo.updateOne(filter, input);
        await this.runPostMiddleware('updateOne', args);
    }

    async updateMany(input: any, filter: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'updateMany', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        await this.repo.updateMany(filter, input);
        await this.runPostMiddleware('updateMany', args);
    }

    async removeOne(filter: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'removeOne', { context, filter });
        filter = args.filter;
        
        await this.repo.removeOne(filter);
        await this.runPostMiddleware(
            'removeOne', args);
    }

    async removeMany(filter: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'removeMany', { context, filter });
        filter = args.filter;
        
        await this.repo.removeMany(filter);
        await this.runPostMiddleware(
            'removeMany', args);
    }

    protected async runMiddleware(middleware: CRUDMiddleware[], args: any, method: string) {
        let i = 0;
        while (i < middleware.length) {
            await middleware[i](args, method, CRUD_OPERATIONS[method]);
            i++;
        }
        return args;
    }

    pre(methods: string | string[], middleware: CRUDMiddleware) {
        super.pre(methods, middleware);
    }

    post(methods: string | string[], middleware: CRUDMiddleware) {
        super.post(methods, middleware);
    }
}
