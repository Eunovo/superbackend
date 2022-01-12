import { Observable } from "../Observable";
import { FilterOptions, Repository } from "../repositories";
import { Service } from "../Service";
import { Filter } from "./Filter";


export class CRUDService<T = any> extends Service {

    constructor(
        observable: Observable,
        protected repo: Repository
    ) { super(observable) }

    async create(input: T, context: any = {}) {
        const id = await this.repo.create(input);
        this.fire('create', { id, input, context });
        return id;
    }

    async findOne(filter: Filter<T>, context: any = {}) {
        const result = await this.repo.findOne(filter);
        if (!result) throw new Error('Not Found');
        this.fire('read', { filter, context });
        return result;
    }

    async findMany(filter: Filter<T>, options?: FilterOptions, context: any = {}) {
        const results = await this.repo.findMany(filter, options);
        this.fire('read', { filter, options, context, results });
        return results;
    }

    async updateOne(input: T, filter: Filter<T>, context: any = {}) {        
        await this.repo.updateOne(filter, input);
        this.fire('update', { input, filter, context });
    }

    async updateMany(input: T, filter: Filter<T>, context: any = {}) {        
        await this.repo.updateMany(filter, input);
        this.fire('update', { input, filter, context });
    }

    async removeOne(filter: Filter<T>, context: any = {}) {
        await this.repo.removeOne(filter);
        this.fire('remove', { filter, context });
    }

    async removeMany(filter: Filter<T>, context: any = {}) {
        await this.repo.removeMany(filter);
        this.fire('remove', { filter, context });
    }

}
