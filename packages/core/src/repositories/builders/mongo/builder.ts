import { Model } from "../../../Model";
import { handleMongooseError } from "./error-handler";
import { buildSchema } from "./schema";

export const buildMongoSchema = (model: Model) => {
    const mongooseSchema = buildSchema(model);

    mongooseSchema.post('save', handleMongooseError);
    mongooseSchema.post('insertMany', handleMongooseError);
    mongooseSchema.post('update', handleMongooseError);
    mongooseSchema.post('findOneAndUpdate', handleMongooseError);

    return mongooseSchema;
}
