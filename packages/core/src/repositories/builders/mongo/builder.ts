import { Schema } from "mongoose";
import { Model } from "../../../model/Model";
import { handleMongooseError } from "./error-handler";
import { buildSchema } from "./schema";

export const buildMongoSchema = <T> (model: Model): Schema<T> => {
    const mongooseSchema = buildSchema(model);

    mongooseSchema.post('save', handleMongooseError);
    mongooseSchema.post('insertMany', handleMongooseError);
    mongooseSchema.post('update', handleMongooseError);
    mongooseSchema.post('findOneAndUpdate', handleMongooseError);

    return mongooseSchema;
}
