import "jest";
import { buildServices } from "../src";

const schemaPath = "./test/mock.graphql";

test.todo("it should create CRUD services for models defined in the gql schema", () => {
    const services: any = buildServices(schemaPath);
    expect(services.User).toBeDefined();
});

describe("CRUD test", () => {

    test.todo("it should create data and save to db");

    test.todo("it should find data in db");

    test.todo("it should update data in db");

    test.todo("it should delete data matching the params in the db");

});
