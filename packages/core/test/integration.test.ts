import "jest";
import { connect, connection } from "mongoose";
import container from "../src/inversify.config";
import { setPermissions, UnauthorisedError } from "../src";
import { UserController, UserService } from "./test-models";

const DB_URL = "mongodb://localhost:27017/AthenaServicesTest";
const userService = container.get(UserService);
const userController = container.get(UserController);

setPermissions({
    user: {
        create: { public: true },
        read: { owner: true, admin: true },
        update: { owner: true, admin: true },
        delete: { admin: true }
    }
});

describe("CRUD test", () => {

    beforeAll((done) => {
        connect(DB_URL, (err) => {
            if (err) {
                console.error(err);
            }
            done();
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
        const admin = { principal: { username: 'bob', role: 'admin' } };

        const _id = await userService.create({ username });
        let result = await userService.findOne({ _id }, admin);
        expect(result.username).toBe(username);

        const oldUsername = username;
        username = 'updated';
        await userService.updateOne(
            { username },
            { username: oldUsername },
            admin
        );

        result = await userService.findOne({ username }, admin);
        expect(result.username).toBe(username);

        await expect(userService.findOne({ username: oldUsername }, admin))
            .rejects.toHaveProperty('message', 'Not Found');

        await userService.removeOne({ username }, admin);
        await expect(userService.findOne({ username }, admin))
            .rejects.toHaveProperty('message', 'Not Found');
    });

    test("it should force authorised queries", async () => {
        let username = 'authorised';

        await userService.create({ username });
        await userService.create({ username: 'unauthorised' });

        const findMany = async (args: any) => {
            let result = await userService.findMany(args.filter, {}, {
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
            role: 'admin',
            length: 2
        });

        await findMany({
            filter: { username },
            username: 'unauthorised',
            role: 'user',
            length: 0
        });
    });

    test("it should handle rest request appropriately", async () => {
        const USER_ROUTE = '/users'
        expect(userController.route).toEqual(USER_ROUTE);
        const postHandler = userController.getHandler(`${USER_ROUTE}/`, 'post');
        const getHandler = userController.getHandler(`${USER_ROUTE}/get`, 'get');

        if (!postHandler || !getHandler) fail('Handler is not defined');

        const username = 'ctrller_test';
        await postHandler({
            body: { username }
        });

        const response = await getHandler({
            query: {},
            user: { username, role: 'admin' }
        });

        expect(response.data.results[0]?.username).toEqual(username);
    });

    test.todo("it should delete data matching the params in the db");

    test(
        "it should throw Unauthorised Error if request is not authenticated",
        () => {
            const user = { username: 'bob' };
            const handler = userController.getHandler('/users/require-auth', 'get');
        
            if (!handler) fail('Handler is not defined');

            handler({ user, query: {} });
            expect(() => handler({ query: {} })).toThrowError(UnauthorisedError);
        }
    );

});
