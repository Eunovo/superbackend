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
        const args = await this.runPreMiddleware(
            'create', { context, input });
        input = args.input;
        
        return this.repo.create(input);
    }

    async findOne(filter: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'findOne', { context, filter });
        filter = args.filter;

        const result = await this.repo.findOne(filter);
        if (!result) throw new Error('Not Found');
        return result;
    }

    async findMany(filter: any, options?: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'findMany', { context, filter, options });
        filter = args.filter;
        options = args.options;

        return this.repo.findMany(filter, options);
    }

    async updateOne(input: any, filter: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'updateOne', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        await this.repo.updateOne(filter, input);
    }

    async updateMany(input: any, filter: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'updateMany', { context, input, filter });
        filter = args.filter;
        input = args.input;
        
        return this.repo.updateMany(filter, input);
    }

    async removeOne(filter: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'removeOne', { context, filter });
        filter = args.filter;
        
        return this.repo.removeOne(filter);
    }

    async removeMany(filter: any, context: any = {}) {
        const args = await this.runPreMiddleware(
            'removeMany', { context, filter });
        filter = args.filter;
        
        return this.repo.removeMany(filter);
    }

}
