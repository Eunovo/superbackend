import "jest";
import { connect, connection } from "mongoose";
import { join } from "path";
import { buildServices, buildMongoRepo } from "../src";
import {
    CRUDPlugin,
    UsernamePasswordAuthPlugin,
    AuthorizationPlugin,
    RelationshipPlugin
} from "../src/plugins";

const schemaPath = join(__dirname, "./mock.graphql");
const DB_URL = "mongodb://localhost:27017/AthenaServicesTest";

const { services }: any = buildServices(
    schemaPath, buildMongoRepo, [
    new CRUDPlugin(),
    new RelationshipPlugin(),
    new UsernamePasswordAuthPlugin(),
    new AuthorizationPlugin()
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

    afterEach(async () => {
        const promises = Object.values(connection.models)
            .map((model) => model.deleteMany({}));
        await Promise.all(promises);
    });

    afterAll(() => connection.close());

    test("it should create data and save to db", async () => {
        let username = 'experiment';

        const _id = await services.User.create({ username });
        let result = await services.User.findOne({ _id });
        expect(result.username).toBe(username);

        const oldUsername = username;
        username = 'updated'
        await services.User.updateOne({ username }, { username: oldUsername });

        result = await services.User.findOne({ username });
        expect(result.username).toBe(username);

        expect(services.User.findOne({ username: oldUsername }))
            .rejects.toHaveProperty('message', 'Not Found');

        await services.User.removeOne({ username });
        expect(services.User.findOne({ username }))
            .rejects.toHaveProperty('message', 'Not Found');
    });

    test.only("it should force authorised queries", async () => {
        let username = 'authorised';

        await services.User.create({ username });
        const otherId = await services.User.create({ username: 'unauthorised' });
        let result = await services.User
            .findMany(
                {}, {},
                { principal: { username, role: 'user' } }
            );

        expect(result.length).toEqual(1);
        expect(result[0].username).toEqual(username);

        result = await services.User
            .findMany(
                { _id: otherId }, {},
                { principal: { username, role: 'user' } }
            );
        expect(result.length).toEqual(0);
    });

    test("it should handle foreign values", async () => {
        let username = 'username';

        services.User.post('create', async (args: any) => {
            const { id } = args;
            await services.Test.create({ user: id });
        });

        await services.User.create({ username });
        await services.Store.create({ owner: username });
        expect(services.Store.create({ owner: 'Illegal' }))
            .rejects.toHaveProperty('message', 'Not Found');
    });

    test.todo("it should delete data matching the params in the db");

});
