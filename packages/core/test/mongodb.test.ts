import "jest";
import { connect, connection } from "mongoose";
import {
    defaultValue, enums, Field, field, inject, Model, model,
    MongoRepository, repo, required, unique
} from "../src";
import container from "../src/inversify.config";
import { buildSchema } from "../src/repositories/builders/mongo/schema";

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
        await repo.create({ username, email: 'email', locations: ['Lagos'] });
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

    test("it should handle enums", async () => {
        const repo = container.get(UserRepo);

        const username = "Novo";
        await repo.create({ username, email: 'email', color: Color.red });
        await expect(repo.updateOne({ username }, { color: 'blue' }))
            .rejects;
    });

    test("it should handle sub schema", async () => {
        const model = new Model('Test', {
            user: new Field('user', 'user', 'User')
        });
        const repo = new MongoRepository<{ user: User }>(model);

        try {
            await repo.create({ user: { username: 'Novo', email: 'email' } });
        } catch (error) {
            console.log(error);
            fail('Failed to create document');
        }
        
        await expect(repo.create(<any>{ user: {} }))
            .rejects.toThrowError('Validation Errors');
    });

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

enum Color {
    red = 'red', green = 'green'
}

@model('User')
class User {
    @required()
    @field('username', 'String')
    username!: string

    @required()
    @field('email', 'String')
    email!: string

    @defaultValue([])
    @field('locations', '[String]')
    locations?: string[]

    @enums(Color)
    @field('color', 'String')
    color?: Color
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

@repo()
class UserRepo extends MongoRepository<User> {
    constructor(@inject(User) model: Model) {
        super(model);
    }
}

@repo()
class TestMetadataRepo extends MongoRepository<TestMetadata> {
    constructor(@inject(TestMetadata) model: Model) {
        super(model);
    }
}

@repo()
class TestErrorRepo extends MongoRepository<TestError> {
    constructor(@inject(TestError) model: Model) {
        super(model);
    }
}
