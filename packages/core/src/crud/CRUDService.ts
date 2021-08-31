import { Observable } from "../Observable";
import { FilterOptions, Repository } from "../repositories";
import { Service } from "../Service";
import { CRUD_OPERATIONS, CRUDMiddleware } from "./CRUDOps";
import { Filter } from "./Filter";


export class CRUDService extends Service {

    constructor(
        observable: Observable,
        protected repo: Repository
    ) { super(observable) }

    async create(input: any, context: any = {}) {
        let args = await this.runPreMiddleware(
            'create', { context, input });
        
        input = args.input;
        const id = await this.repo.create(input);
        args = await this.runPostMiddleware(
            'create', { ...args, id });

        this.fire('create', { id, ...args });
        return args.id;
    }

    async findOne(filter: Filter, context: any = {}) {
        let args = await this.runPreMiddleware(
            'findOne', { context, filter });
        filter = args.filter;

        const result = await this.repo.findOne(filter);
        if (!result) throw new Error('Not Found');

        args = await this.runPostMiddleware(
            'findOne', { ...args, result });

        this.fire('read', args);
        return args.result;
    }

    async findMany(filter: Filter, options?: FilterOptions, context: any = {}) {
        let args = await this.runPreMiddleware(
            'findMany', { context, filter, options });
        filter = args.filter;
        options = args.options;

        const results = await this.repo.findMany(filter, options);
        args = await this.runPostMiddleware(
            'findMany', { ...args, results });

        this.fire('read', args);
        return args.results;
    }

    async updateOne(input: any, filter: Filter, context: any = {}) {
        let args = await this.runPreMiddleware(
            'updateOne', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        await this.repo.updateOne(filter, input);
        await this.runPostMiddleware('updateOne', args);

        this.fire('update', args);
    }

    async updateMany(input: any, filter: Filter, context: any = {}) {
        let args = await this.runPreMiddleware(
            'updateMany', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        await this.repo.updateMany(filter, input);
        await this.runPostMiddleware('updateMany', args);
        this.fire('update', args);
    }

    async removeOne(filter: Filter, context: any = {}) {
        let args = await this.runPreMiddleware(
            'removeOne', { context, filter });
        filter = args.filter;
        
        await this.repo.removeOne(filter);
        await this.runPostMiddleware(
            'removeOne', args);
        this.fire('remove', args);
    }

    async removeMany(filter: Filter, context: any = {}) {
        let args = await this.runPreMiddleware(
            'removeMany', { context, filter });
        filter = args.filter;
        
        await this.repo.removeMany(filter);
        await this.runPostMiddleware(
            'removeMany', args);
        this.fire('remove', args);
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
