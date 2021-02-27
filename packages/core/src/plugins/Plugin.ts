import { Models, Repositories, Services } from "../utils";
import { GraphQLSchema } from "graphql";


export abstract class Plugin<T = any> {

    setup(schema: GraphQLSchema, models: Models) {}

    abstract transformServices(models: Models, repos: Repositories, services: Services): void

}
