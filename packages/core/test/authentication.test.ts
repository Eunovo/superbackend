import "jest";
import { buildSchema } from "graphql";
import {
    AuthService,
    extractModelsFrom,
    UsernamePasswordAuthPlugin
} from "../src";


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
            }
        };

        let service = new AuthService(repo);

        const authPlugin = new UsernamePasswordAuthPlugin();
        authPlugin
            .transformServices(models, { 'User': repo }, { 'User': service });

        await service.create({ username, password });
        await service.authenticate(username, password);
        await expect(service.authenticate(username, 'fakepassword'))
            .rejects.toThrow('Unauthorised');

        expect.assertions(2);
    });
});
