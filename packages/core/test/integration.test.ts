import "jest";
import { connect, connection } from "mongoose";
import { join } from "path";
import { SuperBackend, buildMongoRepo } from "../src";
import {
    UsernamePasswordAuthPlugin,
    AuthorizationPlugin,
    RelationshipPlugin
} from "../src/plugins";

const schemaPath = join(__dirname, "./mock.graphql");
const DB_URL = "mongodb://localhost:27017/AthenaServicesTest";

const backend = new SuperBackend(buildMongoRepo);

backend.plugin(new RelationshipPlugin());
backend.plugin(new UsernamePasswordAuthPlugin());
backend.plugin(new AuthorizationPlugin());

const { models, services, controllers } = backend.build(schemaPath);

const USER_ROUTE = '/users';

test("it should create CRUD services for models defined in the gql schema", () => {
    expect(services.User).toBeDefined();
    expect(models.ModelOnly).toBeDefined();
    expect(services.ModelOnly).not.toBeDefined();
});

describe("CRUD test", () => {

    beforeAll(async () => {
        await connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err) => {
            if (err) {
                console.error(err);
            }
        });

        services.User.pre(
            ['create', 'updateOne', 'updateMany'],
            (args, _method, operation) => {
                const { username, role } = args.context.principal ||
                    { username: '', role: '' };
                const { input } = args;

                const grants = args.context.grants.match(role, {
                    'user': username === input.username && 'owner'
                }).authorize(operation);
                grants.inputs(input, username);
            }
        );

        services.User.pre(
            [
                'findOne', 'findMany', 'updateOne',
                'updateMany', 'removeOne', 'removeMany'
            ],
            (args, _method, operation) => {
                const { username, role } = args.context.principal ||
                    { username: '', role: '' };
                const { filter } = args;
                args.filter = args.context.grants.match(
                    role, { 'user': filter.username === username && 'owner' }
                ).authorize(operation)
                    .filter(filter, username);
            }
        );
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
        username = 'updated';
        await services.User.updateOne(
            { username },
            { username: oldUsername },
            { principal: { username: 'bob', role: 'admin' } }
        );

        result = await services.User.findOne({ username });
        expect(result.username).toBe(username);

        expect(services.User.findOne({ username: oldUsername }))
            .rejects.toHaveProperty('message', 'Not Found');

        await services.User.removeOne({ username });
        expect(services.User.findOne({ username }))
            .rejects.toHaveProperty('message', 'Not Found');
    });

    test("it should force authorised queries", async () => {
        let username = 'authorised';
        const context = { principal: { username, role: 'user' } };
        const unauthorisedContext = {
            principal: { username: 'unauthorised', role: 'user' }
        };

        await services.User.create({ username });
        await services.User
            .create({ username: 'unauthorised' });

        const findMany = async (args: any) => {
            let result = await services.User
                .findMany(args.filter, {}, {
                    principal: {
                        username: args.username,
                        role: args.role
                    }
                });
            expect(result.length).toEqual(args.length);
        }

        await findMany({
            filter: {},
            username,
            role: 'user',
            length: 2
        });

        // `unauthorised` can see `authorised`
        // before any blocking operation
        await findMany({
            filter: { username },
            username: 'unauthorised',
            role: 'user',
            length: 1
        });

        // a user should not be able to
        // update another user
        await expect(services.User
            .updateOne(
                { blocked: ['unauthorised'] },
                { username },
                unauthorisedContext
            )).rejects.toThrow('Unauthorised');

        // since the update failed
        // the blocked list should remain unchanged
        await findMany({
            filter: { username },
            username: 'unauthorised',
            role: 'user',
            length: 1
        });

        // a user should be able to update their
        // blocked list
        await services.User
            .updateOne(
                { blocked: ['unauthorised'] },
                { username },
                context
            );

        // the blocked list should be updated
        // `unauthorised` should not be able to
        // see `authorised`
        await findMany({
            filter: { username },
            username: 'unauthorised',
            role: 'user',
            length: 0
        });
    });

    test("it should handle foreign values", async () => {
        let username = 'username';

        services.User.post('create', async (args: any) => {
            const { id } = args;
            await services.Test.create({ user: id });
        });

        await services.User.create({ username });
        await services.Store.create({ owner: username });
        await expect(services.Store.create({ owner: 'Illegal' }))
            .rejects.toThrow('Not Found');
    });

    test("it should handle rest request appropriately", async () => {
        expect(controllers.User.route).toEqual(USER_ROUTE);
        const postHandler = controllers.User.getHandler(`${USER_ROUTE}/`, 'post');
        const getHandler = controllers.User.getHandler(`${USER_ROUTE}/`, 'get');
        
        if (!postHandler || !getHandler) fail('Handler is not defined');

        const username = 'ctrller_test';
        await postHandler({
            body: { username }
        });

        const response = await getHandler({
            query: {},
            user: { username, role: 'user' }
        });

        expect(response.data.results[0]?.username).toEqual(username);
    });

    test.todo("it should delete data matching the params in the db");

});
