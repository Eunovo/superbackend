import { Model } from "mongoose";
import { Repository } from "../..";

export class MongoRepository implements Repository {

    constructor(private model: Model<any>) {}

    async create(data: any) {
        const model = new this.model(data);
        await model.save();
    }

    async findOne(filter: any) {
        return this.model.findOne(filter);
    }

    async updateOne(filter: any, update: any) {
        return this.model.updateOne(filter, update);
    }

}