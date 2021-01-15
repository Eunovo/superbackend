import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { Repositories, Services } from "../../utils";

export type CRUDType = {}

export class CRUDService extends Service {
    private repo: Repository;

    constructor(
        private name: string,
        private repos: Repositories,
        private services: Services
    ) {
        super();
        this.repo = this.repos[this.name];
    }

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

    async findMany(filter: any, options?: any, context: any = {}) {
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

}
