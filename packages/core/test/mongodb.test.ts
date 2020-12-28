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
        connect(DB_URL, (err) => {
            if (err) {
                console.error(err);
            }
        });
    });

    afterAll(() => {
        return connection.close();
    })

    test("it should create a document in the mongo database", async () => {
        const models = extractModelsFrom(gqlSchema);
        const userModel = models[0];
        const userRepo = buildMongoRepo(userModel);

        const username = "Novo";

        await userRepo.create({ username });
        let user = await userRepo.findOne({ username });
        expect(user.username).toEqual(username);

        const newUsername = "Bob";
        await userRepo.updateOne({ username }, { username: newUsername });
        
        user = await userRepo.findOne({ username: newUsername });
        expect(user.username).toEqual(newUsername);

        user = await userRepo.findOne({ username });
        expect(user).toEqual(null);
    });
});
