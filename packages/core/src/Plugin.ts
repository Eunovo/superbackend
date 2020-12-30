import { GraphQLObjectType } from "graphql";
import { Repository } from "./repositories";
import { Service } from "./Service";

export type Plugin = (node: GraphQLObjectType, repo: Repository, service: Service) => any;
