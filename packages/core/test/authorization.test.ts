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
        Enable create and read ops for Admins
        @allow('ADMIN', 'create', 'read')
        """
        type Store {
            """
            match owner to the principal's username
            @allowOnMatch('USER', 'create', 'read')
            @ManyToOne('User', 'username')
            """
            owner: String!
            """
            @allowOn('USER', false, 'read')
            """
            blocked: Boolean
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

        // test 'USER' role

        StoreService.create = async function (context: any, input: any) {
            const args = await this.runPreMiddleware(
                'create', { context, input });
            expect(args.input.owner).toEqual(username)
        }

        StoreService.findOne = async function (context: any, filter: any) {
            const args = await this.runPreMiddleware(
                'findOne', { context, filter });
            expect(args.filter.owner).toEqual(username);
            expect(args.filter.blocked).toBeUndefined();
        }

        StoreService.findMany = async function (context: any, filter: any) {
            const args = await this.runPreMiddleware(
                'findMany', { context, filter });
            expect(args.filter.$or[0].owner).toEqual(username);
            expect(args.filter.$or[1].blocked).toEqual(false);
        }

        let context: any = {
            principal: { username, role: 'User' }
        };

        await StoreService.create(context, { owner: impostor });
        await StoreService.findOne(context, { owner: impostor });
        await StoreService.findMany(context, {});

        // test 'SELLER' role

        context = {
            principal: { username, role: 'Seller' }
        };
        await StoreService.findMany(context, {});

        // test 'ADMIN' role

        StoreService.findMany = async function (context: any, filter: any) {
            const args = await this.runPreMiddleware(
                'findOne', { context, filter });
            expect(args.filter.$or).toBeUndefined();
        }

        context = {
            principal: { username, role: 'Admin' }
        };
        // an ADMIN should be allowed to
        // execute read operation on the entire db
        // as defined in the schema
        await StoreService.findMany(context, {});
    });

    test.todo("it should obey custom rules");
});
