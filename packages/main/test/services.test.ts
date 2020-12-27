import "jest";
import { buildServices } from "../src";

const schemaPath = "./test/mock.graphql";

test.todo("it should create CRUD services for models defined in the gql schema", () => {
    const services = buildServices(schemaPath);
});
