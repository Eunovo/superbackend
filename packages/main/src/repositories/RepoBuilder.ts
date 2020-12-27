import { GraphQLObjectType } from "graphql";
import { Repository } from "./Repository";

export type RepoBuilder = (schema: GraphQLObjectType) => Repository;
