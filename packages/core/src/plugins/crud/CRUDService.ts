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
        this.repo = this.repos[name];
    }
    
    async create(context: any, input: any) {
        [context, input] = await this.runPreMiddleware(
            'create', context, input);
        return this.repo.create(input)
    }

    async findOne(context: any, filter: any) {
        [context, filter] = await this.runPreMiddleware(
            'findOne', context, filter);
        const result = await this.repo.findOne(filter);
        if (!result) throw new Error('Not Found');
        return result;
    }

    async findMany(context: any, filter: any, options: any) {
        [context, filter, options] = await this.runPreMiddleware(
            'findMany', context, filter, options);
    }

    async updateOne(context: any, input: any, filter: any) {
        [context, input, filter] = await this.runPreMiddleware(
            'updateOne', context, input, filter);
        await this.repo.updateOne(filter, input);
    }

    async updateMany(context: any, input: any, filter: any) {
        [context, input, filter] = await this.runPreMiddleware(
            'updateMany', context, input, filter);
    }

    async removeOne(context: any, filter: any) {
        [context, filter] = await this.runPreMiddleware(
            'removeOne', context, filter);
    }

    async removeMany(context: any, filter: any) {
        [context, filter] = await this.runPreMiddleware(
            'removeMany', context, filter);
    }

}
