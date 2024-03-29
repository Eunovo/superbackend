import {
    Document,
    Model as MongooseModel,
    model as createMongooseModel,
    FilterQuery,
    LeanDocument,
    AnyKeys
} from "mongoose";
import { Repository, FilterOptions } from "../../Repository";
import { Model } from "../../../model";
import { buildMongoSchema } from "./builder";

export class MongoRepository<T> implements Repository<T> {
    protected mongooseModel: MongooseModel<T>;

    constructor(model: Model) {
        const name = model.name;
        const schema = buildMongoSchema<T>(model);
        this.mongooseModel = createMongooseModel<T>(name, schema);
    }

    async create(data: T) {
        await this.mongooseModel.init();
        const model = new this.mongooseModel(data);
        await model.save();
        if (!model.id) throw new Error('No id');
        return model.id;
    }

    async findOne(filter: FilterQuery<Document<T>>) {
        const result = await this.mongooseModel.findOne(filter)
            .lean()
            .exec();
        return result as T | null;
    }

    async findMany(filter: FilterQuery<Document<T>>, options?: FilterOptions) {
        const query = this.mongooseModel.find(filter);

        ['limit', 'skip'].forEach((key) => {
            const option = options?.[<keyof FilterOptions>key];
            if (option !== undefined && option !== null) (<any>query)[<any>key](option);
        });

        const results = await query.lean().exec();
        return results as unknown as T[];
    }

    async updateOne(filter: FilterQuery<Document<T>>, update: any) {
        await this.mongooseModel.init();
        await this.mongooseModel.updateOne(filter, update)
            .exec();
    }

    async updateMany(filter: FilterQuery<Document<T>>, update: any) {
        await this.mongooseModel.init();
        await this.mongooseModel.updateMany(filter, update)
            .exec();
    }

    async removeOne(filter: FilterQuery<Document<T>>) {
        await this.mongooseModel.findOneAndRemove(filter)
            .exec();
    }

    async removeMany(filter: FilterQuery<Document<T>>) {
        await this.mongooseModel.remove(filter)
            .exec();
    }

}