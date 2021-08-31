import "jest";
import { buildSchema } from "graphql";
import {
    AuthService,
    extractModelsFrom,
    UsernamePasswordAuthPlugin
} from "../src";
import { Observable } from "../src/Observable";


describe("test authentication plugin", () => {
    test("it should hash password on create and update and provide an 'authenticate' method ", async () => {
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
        const models = extractModelsFrom(gqlSchema);

        const username = 'test';
        const password = 'password';
        let testUser: any;

        const repo: any = {
            create: async (input: any) => {
                testUser = input;
                expect(input.password).not.toEqual(password);
            },
            findOne: async () => {
                return testUser;
            },
            updateOne: async (_: any, input: any) => {
                testUser = input;
                expect(input.password).not.toEqual('somethingelse');
            }
        };

        let service = new AuthService(new Observable(), repo);

        const authPlugin = new UsernamePasswordAuthPlugin();
        authPlugin
            .transformServices(models, { 'User': repo }, { 'User': service });

        await service.create({ username, password });
        await service.authenticate(username, password);
        await expect(service.authenticate(username, 'fakepassword'))
            .rejects.toThrow('Unauthorised');

        await service.updateOne({ password: 'somethingelse' }, { username });
        await service.authenticate(username, 'somethingelse');
        await expect(service.authenticate(username, password))
            .rejects.toThrow('Unauthorised');

        expect.assertions(4);
    });
});
