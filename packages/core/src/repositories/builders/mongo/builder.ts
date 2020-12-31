import { model } from "mongoose";
import { MongoRepository } from ".";
import { RepoBuilder } from "../..";
import { Model } from "../../../Model";
import { handleMongooseError } from "./error-handler";
import { buildSchema } from "./schema";

export const buildMongoRepo: RepoBuilder = (modelObj: Model) => {
    const mongooseSchema = buildSchema(modelObj.node);

    mongooseSchema.post('save', handleMongooseError);
    mongooseSchema.post('insertMany', handleMongooseError);
    mongooseSchema.post('update', handleMongooseError);
    mongooseSchema.post('findOneAndUpdate', handleMongooseError);

    const mongooseModel = model(modelObj.name, mongooseSchema);

    return new MongoRepository(mongooseModel);
}