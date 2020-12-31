import "jest";
import { buildSchema } from "graphql";
import { extractModelsFrom, Service, UsernamePasswordAuthPlugin } from "../src";


describe("test authentication plugin", () => {
    test("it should hash password on create and provide an 'authenticate' method ", async () => {
        const gqlSchemaString = `
        """
        @model
        @usernamepasswordauth
        """
        type User {
            """ @username """
            username: String!
            """ @password """
            password: String!
        }
        `;
        const gqlSchema = buildSchema(gqlSchemaString);
        const { User } = extractModelsFrom(gqlSchema);

        const username = 'test';
        const password = 'password';
        let testUser: any;

        const repo: any = {
            findOne: async () => {
                return testUser;
            }
        };

        const create = async function (this: Service, data: any) {
            [testUser] = await this.runPreMiddleware('create', data);
            expect(testUser.password).not.toEqual(password);
        }

        let service: Service = new Service();
        Object.defineProperty(service, 'create', {
            value: create,
            writable: true,
            configurable: true,
            enumerable: false
        });

        const authPlugin = new UsernamePasswordAuthPlugin(gqlSchema, { User });
        const authService: any = authPlugin
            .transformService(User.node, repo, service);

        await authService.create({ username, password });
        await authService.authenticate(username, password);

        expect.assertions(1);
    });
});
