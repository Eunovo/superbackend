import { CRUDService, CRUD } from "../crud";
import { BaseController } from "./BaseController";

/**
 * Selects which CRUD operations to expose
 */
type Methods = { [P in CRUD]?: boolean };

const DEFAULT_METHODS: Methods = {
    create: true, read: true, update: true, delete: true
}

export class CRUDController extends BaseController {
    constructor(
        public readonly route: string,
        protected service: CRUDService,
        protected methods: Methods = DEFAULT_METHODS
    ) {
        super(route);

        this.methods.read && this.get('/', this.getMany.bind(this));
        this.methods.create && this.post('/', this.create.bind(this));
        this.methods.update && this.put('/', this.updateMany.bind(this));
        this.methods.update && this.patch('/', this.updateMany.bind(this));
        this.methods.delete && this.delete('/', this.removeMany.bind(this));
    }

    async create(req: any) {
        const _id = await this.service.create(
            req.body,
            {
                principal: req.user
            }
        );

        return {
            message: 'success',
            data: { _id }
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
        await this.service.updateMany(
            req.body, filter,
            { principal: req.user }
        );

        return {
            message: 'success'
        };
    }

    async removeMany(req: any) {
        const { _limit, _skip, ...filter } = req.query;
        await this.service.removeMany(
            filter,
            { principal: req.user }
        );

        return {
            message: 'success'
        };
    }
}
