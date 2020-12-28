import { GraphQLObjectType } from "graphql";
import { model } from "mongoose";
import { MongoRepository } from ".";
import { RepoBuilder } from "../..";
import { buildSchema } from "./schema";

export const buildMongoRepo: RepoBuilder = (gqlObject: GraphQLObjectType) => {
    const mongooseSchema = buildSchema(gqlObject);
    const mongooseModel = model(gqlObject.name, mongooseSchema);

    return new MongoRepository(mongooseModel);
}