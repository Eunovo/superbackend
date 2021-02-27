import { Model } from "mongoose";
import { Repository, FilterOptions } from "../..";

export class MongoRepository implements Repository {

    constructor(private model: Model<any>) { }

    async create(data: any) {
        await this.model.init();
        const model = new this.model(data);
        await model.save();
        return model._id.toString();
    }

    async findOne(filter: any) {
        const result = await this.model.findOne(filter)
            .exec();
        if (result?._doc) return result._doc;
        return result;
    }

    async findMany(filter: any, options?: FilterOptions) {
        const query = this.model.find(filter);

        ['limit', 'skip'].forEach((key) => {
            const option = options?.[<keyof FilterOptions>key];
            if (option) (<any>query)[<any>key](option);
        });

        const results = await query.exec();
        return results.map((result) => {
            if (result?._doc) return result._doc;
            return result;
        })
    }

    async updateOne(filter: any, update: any) {
        await this.model.init();
        await this.model.updateOne(filter, update)
            .exec();
    }

    async updateMany(filter: any, update: any) {
        await this.model.init();
        await this.model.updateMany(filter, update)
            .exec();
    }

    async removeOne(filter: any) {
        await this.model.findOneAndRemove(filter)
            .exec();
    }

    async removeMany(filter: any) {
        await this.model.remove(filter)
            .exec();
    }

}