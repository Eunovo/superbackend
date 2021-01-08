import { Model } from "mongoose";
import { Repository } from "../..";

export class MongoRepository implements Repository {

    constructor(private model: Model<any>) {}

    async create(data: any) {
        await this.model.init();
        const model = new this.model(data);
        await model.save();
    }

    async findOne(filter: any) {
        return this.model.findOne(filter);
    }

    async findMany(filter: any, options?: any) {
        return this.model.find(filter)
            .skip(options?.skip)
            .limit(options?.limit);
    }

    async updateOne(filter: any, update: any) {
        await this.model.init();
        await this.model.updateOne(filter, update);
    }

    async updateMany(filter: any, update: any) {
        await this.model.init();
        await this.model.updateMany(filter, update);
    }

    async removeOne(filter: any) {
        await this.model.findOneAndRemove(filter);
    }

    async removeMany(filter: any) {
        await this.model.remove(filter);
    }

}