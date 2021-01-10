import "jest";
import { buildSchema } from "graphql";
import { AuthorizationPlugin, extractModelsFrom, Service } from "../src";


describe("Test Authorization", () => {
    test("it should enforce declared access rules", async () => {
        const schemaString = `
        enum Role {
            """
            @create('Store', 'owner')
            @read('Store', 'owner')
            """
            USER
        }

        """@model"""
        type User {
            username: String!
            role: Role!
        }

        """@model"""
        type Store {
            """
            @ManyToOne('User', 'username')
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

        const UserService: any = services.User;
        const StoreService: any = services.Store;

        UserService.create = function (data: any) {

        }
        StoreService.create = async function (context: any, input: any) {
            await this.runPreMiddleware('create', { context, input });
        }
        StoreService.findMany = async function (context: any, filter: any) {
            await this.runPreMiddleware('findMany', { context, filter });
        }

        await UserService.create({ username: 'novo', role: 'USER' });
        await UserService.create({ username: 'ben', role: 'USER' });

        const context: any = {
            principal: { username: 'novo', role: 'User' }
        };

        const testAuth = async (method: string, ...args: any[]) => {
            await StoreService[method](context, { owner: 'novo' }, ...args);
            expect(StoreService[method](context, { owner: 'ben' }, ...args))
                .rejects.toThrow();
        }

        await testAuth('create');
        await testAuth('findMany');
    });
});
