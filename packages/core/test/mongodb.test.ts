import "jest";
import { connect, connection } from "mongoose";
import {
    defaultValue, field, model,
    MongoRepository, repo, required, unique
} from "../src";
import container from "../src/inversify.config";

const DB_URL = "mongodb://localhost:27017/AthenaMongoTest";

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
        const repo = container.get(UserRepo);

        const username = "Novo";
        await repo.create({ username });
        let user = await repo.findOne({ username });
        expect(user?.username).toEqual(username);

        const newUsername = "Bob";
        await repo.updateOne({ username }, { username: newUsername });

        user = await repo.findOne({ username: newUsername });
        expect(user?.username).toEqual(newUsername);

        user = await repo.findOne({ username });
        expect(user).toEqual(null);
    });

    test("it should translate metadata into schema definition", async () => {
        const repo = container.get(TestMetadataRepo);

        const username = "Novo";
        await repo.create({ username });
        expect(repo.create({ username })).rejects.toThrow();

        const test = await repo.findOne({ username });
        expect(test?.indicator).toEqual('default');
    });

    // test("it should enforce enums", async () => {
    //     const schemaString = `
    //         """
    //         @model
    //         """
    //         type TestEnum {
    //             username: String!
    //             role: Role!
    //         }

    //         enum Role {
    //             USER
    //             ADMIN
    //         }
    //     `;

    //     const schema = buildSchema(schemaString);
    //     const models = extractModelsFrom(schema);
    //     const repo = buildMongoRepo(models.TestEnum);

    //     const username = "Novo";
    //     await repo.create({ username, role: 'USER' });
    //     await expect(repo.create({ username, role: 'INVALID' })).rejects.toThrow();
    // });

    test("it should handle mongoose errors", async () => {
        const repo = container.get(TestErrorRepo);

        const username = "Novo";
        await repo.create({ username, createdAt: new Date() });
        
        expect(repo.create(({} as any)))
            .rejects
            .toHaveProperty('errors', [
                { name: 'createdAt', message: 'createdAt is required' },
                { name: 'username', message: 'username is required' }
            ]);

        expect(repo.create(({ username, createdAt: "invalid" } as any)))
            .rejects
            .toHaveProperty('errors', [
                { name: 'createdAt', message: "Cast to date failed for 'invalid'" }
            ]);
    });
});

@model('User')
class User {
    @required()
    @field('username', 'String')
    username!: string
}

@model('TestMetadata')
class TestMetadata {
    @unique()
    @field('username', 'String')
    username!: string;

    @defaultValue('default')
    @field('indicator', 'String')
    indicator?: string;
}

@model('TestError')
class TestError {
    @required()
    @field('username', 'String')
    username!: string

    @required()
    @field('createdAt', 'Date')
    createdAt!: Date
}

@repo(User)
class UserRepo extends MongoRepository<User> {}

@repo(TestMetadata)
class TestMetadataRepo extends MongoRepository<TestMetadata> {}

@repo(TestError)
class TestErrorRepo extends MongoRepository<TestError> {}
