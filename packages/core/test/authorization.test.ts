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
        const userRepo: any = {};
        const storeRepo: any = {};

        const plugin = new AuthorizationPlugin(gqlSchema, { User, Store });

        const UserService: any = plugin.transformService(User.node, userRepo, new Service());
        const StoreService: any = plugin.transformService(Store.node, storeRepo, new Service());
        UserService.create = function (data: any) {

        }
        StoreService.create = async function (context: any, data: any) {
            [context, data] = await this.runPreMiddleware('create', context, data);
        }
        StoreService.findBy = async function (context: any, data: any) {
            [context, data] = await this.runPreMiddleware('findBy', context, data);
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
        await testAuth('findBy');
    });
});
