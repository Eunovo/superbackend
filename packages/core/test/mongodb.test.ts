import "jest";
import { connect, connection } from "mongoose";
import { join } from "path";
import { readFileSync } from "fs";
import { buildMongoRepo, extractModelsFrom } from "../src";
import { buildSchema } from "graphql";

const schemaPath = join(__dirname, "./mock.graphql");
const schemaString = readFileSync(schemaPath).toString();
const gqlSchema = buildSchema(schemaString);

const DB_URL = "mongodb://localhost:27017/AthenaTest";

describe("Test MongoDB repo builder", () => {

    beforeAll(() => {
        connect(DB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }, (err) => {
            if (err) {
                console.error(err);
            }
        });
    });

    afterAll(async () => {
        const promises = Object.values(connection.models)
            .map((model) => model.deleteMany({}));
        await Promise.all(promises);

        return connection.close();
    });

    test("it should create a document in the mongo database", async () => {
        const models = extractModelsFrom(gqlSchema);
        const userModel = models.User;
        const repo = buildMongoRepo(userModel);

        const username = "Novo";

        await repo.create({ username });
        let user = await repo.findOne({ username });
        expect(user.username).toEqual(username);

        const newUsername = "Bob";
        await repo.updateOne({ username }, { username: newUsername });

        user = await repo.findOne({ username: newUsername });
        expect(user.username).toEqual(newUsername);

        user = await repo.findOne({ username });
        expect(user).toEqual(null);
    });

    test("it should translate metadata into schema definition", async () => {
        const defaultValue = 'test';
        const schemaString = `
            """
            @model
            """
            type TestMetadata {
                """
                @unique
                """
                username: String!
                """
                @default('${defaultValue}')
                """
                indicator: String
            }
        `;

        const schema = buildSchema(schemaString);
        const models = extractModelsFrom(schema);
        const repo = buildMongoRepo(models.TestMetadata);

        const username = "Novo";
        await repo.create({ username });
        expect(repo.create({ username })).rejects.toThrow();

        const user = await repo.findOne({ username });
        expect(user.indicator).toEqual(defaultValue);
    });

    test("it should enforce enums", async () => {
        const schemaString = `
            """
            @model
            """
            type TestEnum {
                username: String!
                role: Role!
            }

            enum Role {
                USER
                ADMIN
            }
        `;

        const schema = buildSchema(schemaString);
        const models = extractModelsFrom(schema);
        const repo = buildMongoRepo(models.TestEnum);

        const username = "Novo";
        await repo.create({ username, role: 'USER' });
        expect(repo.create({ username, role: 'INVALID' })).rejects.toThrow();
    });

    test("it should handle mongoose errors", async () => {
        const schemaString = `
            scalar Date
            
            """
            @model
            """
            type TestError {
                username: String!
                createdAt: Date!
            }
        `;

        const schema = buildSchema(schemaString);
        const models = extractModelsFrom(schema);
        const repo = buildMongoRepo(models.TestError);

        const username = "Novo";
        await repo.create({ username, createdAt: new Date() });
        
        expect(repo.create({}))
            .rejects
            .toHaveProperty('errors', [
                { name: 'createdAt', message: 'createdAt is required' },
                { name: 'username', message: 'username is required' }
            ]);

        expect(repo.create({ username, createdAt: "invalid" }))
            .rejects
            .toHaveProperty('errors', [
                { name: 'createdAt', message: "Cast to date failed for 'invalid'" }
            ]);
    });
});
