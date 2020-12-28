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

    async updateOne(filter: any, update: any) {
        await this.model.init();
        return this.model.updateOne(filter, update);
    }

}