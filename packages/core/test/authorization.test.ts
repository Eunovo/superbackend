import "jest";
import { buildSchema } from "graphql";
import { AuthorizationPlugin, extractModelsFrom, Service } from "../src";


describe("Test Authorization", () => {
    test("it should enforce declared access rules", async () => {
        const schemaString = `
        enum Role {
            USER
            """@extends('USER')"""
            SELLER
            """@extends('USER')"""
            ADMIN
        }

        """
        @model
        @principal
        """
        type User {
            username: String!
            role: Role!
        }

        """
        @model
        @deny('*', '*', 'create', 'update')
        Enable create and read ops for Admins
        @allow('ADMIN', '*', 'create', 'update')
        """
        type Store {
            """
            @allow('USER', 'owner', 'create', 'read')
            """
            owner: String!
        }
        `;
        const gqlSchema = buildSchema(schemaString);
        const { User, Store } = extractModelsFrom(gqlSchema);
        const repos: any = {
            'User': {},
            'Store': {}
        }

        const plugin = new AuthorizationPlugin();
        plugin.setup(gqlSchema, { User, Store });
        const services = {
            'User': new Service(),
            'Store': new Service()
        };

        plugin.transformServices({ User, Store }, repos, services);

        const StoreService: any = services.Store;
        const username = 'novo';
        const impostor = 'bob';

        StoreService.create = async function (context: any, input: any) {
            await this.runPreMiddleware(
                'create', { context, input });
            const subject = context.principal.username;

            const isGranted = (groups: string[]) =>
                groups.reduce((prev: boolean, cur: string) => {
                    return prev || context.grants.role(context.principal.role, cur)
                        .authorize('create')
                        .checkInputs(input, subject)
                }, false);

            if (subject === input.owner) {
                return isGranted(['owner', '*']);
            } else {
                return isGranted(['*']);
            }
        }

        StoreService.findOne = async function (context: any, filter: any) {
            await this.runPreMiddleware(
                'findOne', { context, filter });
            const { username, role } = context.principal;

            const safeFilter = context.grants.x(role, {
                'user': 'owner', 'seller': 'owner'
            }).authorize('read').transformFilter(filter, username);

            return safeFilter;
        }

        // test 'USER' role

        let context: any = {
            principal: { username, role: 'user' }
        };

        await expect(StoreService
            .create(context, { owner: impostor }))
            .resolves.toBe(false);
        await expect(StoreService
            .create(context, { owner: username }))
            .resolves.toBe(true);

        let filter = await StoreService
            .findOne(context, { owner: impostor });
        expect(filter.$or).toContainEqual({ owner: username });
        expect(filter.$and).toBeUndefined();

        // test 'SELLER' role
        // it should behave like 'USER' because it extends 'USER'
        context = {
            principal: { username, role: 'Seller' }
        };
        filter = await StoreService
            .findOne(context, { owner: impostor });
        expect(filter.$or).toContainEqual({ owner: username });
        expect(filter.$and).toBeUndefined();

        // test 'ADMIN' role
        context = {
            principal: { username, role: 'Admin' }
        };
        // an ADMIN should be allowed to
        // execute read operation on the entire db
        // as defined in the schema
        filter = await StoreService
            .findOne(context, {});
        expect(filter.$or?.length).toBe(1);
        expect(filter.$or).toContainEqual({});
        expect(filter.$and).toBeUndefined();
    });

    test.todo("it should obey custom rules");
});
