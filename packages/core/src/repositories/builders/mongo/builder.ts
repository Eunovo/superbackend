import { GraphQLObjectType } from "graphql";
import { model } from "mongoose";
import { MongoRepository } from ".";
import { RepoBuilder } from "../..";
import { handleMongooseError } from "./error-handler";
import { buildSchema } from "./schema";

export const buildMongoRepo: RepoBuilder = (gqlObject: GraphQLObjectType) => {
    const mongooseSchema = buildSchema(gqlObject);

    mongooseSchema.post('save', handleMongooseError);
    mongooseSchema.post('insertMany', handleMongooseError);
    mongooseSchema.post('update', handleMongooseError);
    mongooseSchema.post('findOneAndUpdate', handleMongooseError);

    const mongooseModel = model(gqlObject.name, mongooseSchema);

    return new MongoRepository(mongooseModel);
}