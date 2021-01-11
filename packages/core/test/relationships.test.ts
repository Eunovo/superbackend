import "jest";
import { buildSchema } from "graphql";
import { extractModelsFrom, RelationshipPlugin, Service } from "../src";


describe("Test relationships", () => {
    test("it should load relationship models", (done) => {
        const schemaString = `
        """@model"""
        type User {
            username: String!
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
        const models = extractModelsFrom(gqlSchema);
        const repos: any = {};
        const service: any = new Service();
        service.create = async function (input: any) {
            const args = await this.runPreMiddleware(
                'create', { input });
            expect(args._foreign.owner).toBeDefined();
            done();
        }

        const UserService: any = {
            findOne: () => {
                return {};
            }
        };

        const plugin = new RelationshipPlugin();
        plugin.transformServices(models, repos, {
            'User': UserService,
            'Store': service
        });
        service.create({ owner: 'username' });
    });
});
