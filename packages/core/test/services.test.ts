import "jest";
import { connect, connection } from "mongoose";
import { join } from "path";
import { buildServices, buildMongoRepo } from "../src";
import { CRUDPlugin } from "../src/plugins/crud";

const schemaPath = join(__dirname, "./mock.graphql");
const DB_URL = "mongodb://localhost:27017/AthenaTest";

const { services }: any = buildServices(
    schemaPath, buildMongoRepo, [
        new CRUDPlugin()
    ]
);

test("it should create CRUD services for models defined in the gql schema", () => {
    expect(services.User).toBeDefined();
});

describe("CRUD test", () => {

    beforeAll(() => {
        connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err) => {
            if (err) {
                console.error(err);
            }
        });
    });

    afterAll(async () => {
        const promises = Object.values(connection.models)
            .map((model) => model.deleteMany({}));
        await Promise.all(promises);

        return connection.close();
    });

    test("it should create data and save to db", async () => {
        let username = 'experiment';

        await services.User.create({ username });
        let result = await services.User.findOne({ username });
        expect(result.username).toBe(username);
    
        const OldUsername = username;
        username = 'updated'
        await services.User.updateOne({ username }, { username: OldUsername });

        result = await services.User.findOne({ username });
        expect(result.username).toBe(username);

        expect(services.User.findOne({ username: OldUsername }))
            .rejects.toHaveProperty('message', 'Not Found');

        await services.User.removeOne({ username });
        expect(services.User.findOne({ username }))
            .rejects.toHaveProperty('message', 'Not Found');
    });

    test.todo("it should delete data matching the params in the db");

});
