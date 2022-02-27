import "jest";
import {
    UsernamePasswordAuthService, Model, Repository, inject, MODELS,
} from "../src";
import { Observable } from "../src/Observable";
import { model, field, username, password } from "../src";

@model('User')
export class User {
    @username()
    @field('username', 'String')
    username?: string;

    @password()
    @field('password', 'String')
    password?: string;
}


class UserService extends UsernamePasswordAuthService {
    constructor(
        observable: Observable,
        repo: Repository,
        model: Model
    ) {
        super(observable, repo, model);
    }
}

describe("test authentication plugin", () => {
    test("it should hash password on create and update and provide an 'authenticate' method ", async () => {
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

        let service = new UserService(new Observable(), repo, MODELS[User as any]);

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
