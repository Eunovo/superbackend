import { CRUDService, CRUD } from "../crud";
import { Filter } from "../crud/Filter";
import { BaseController } from "./BaseController";
import { IRequest } from "./IRequest";

/**
 * Selects which CRUD operations to expose
 */
type Methods = { [P in CRUD]?: boolean };

const DEFAULT_METHODS: Methods = {
    create: true, read: true, update: true, delete: true
}

export class CRUDController<T = any> extends BaseController {
    constructor(
        public readonly route: string,
        protected service: CRUDService<T>,
        protected methods: Methods = DEFAULT_METHODS
    ) {
        super(route);

        this.methods.read && this.get('/', this.getMany.bind(this));
        this.methods.create && this.post('/', this.create.bind(this));
        this.methods.update && this.put('/', this.updateMany.bind(this));
        this.methods.update && this.patch('/', this.updateMany.bind(this));
        this.methods.delete && this.delete('/', this.removeMany.bind(this));
    }

    async create(req: IRequest<T, Partial<T>, {}>) {
        const _id = await this.service.create(
            req.body ?? (<any>{}),
            {
                principal: req.user,
                auth: true
            }
        );

        return {
            message: 'success',
            data: { _id }
        };
    }

    async getMany(req: IRequest<T, Partial<T> & { _limit?: number, _skip?: number }, {}>) {
        const { _limit, _skip, ...filter } = req.query || {};

        const data = {
            results: await this.service.findMany(
                filter as Filter<T>,
                { limit: _limit, skip: _skip },
                {
                    principal: req.user,
                    auth: true
                }
            )
        };

        return {
            message: 'success', data
        };
    }

    async updateMany(req: IRequest<T, Partial<T>, {}>) {
        const filter = req.query || {};
        await this.service.updateMany(
            req.body ?? (<any>{}), filter,
            {
                principal: req.user,
                auth: true
            }
        );

        return {
            message: 'success'
        };
    }

    async removeMany(req: IRequest<T, Partial<T>, {}>) {
        const filter = req.query || {};
        await this.service.removeMany(
            filter,
            {
                principal: req.user,
                auth: true
            }
        );

        return {
            message: 'success'
        };
    }
}
