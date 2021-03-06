import "jest"
import * as path from 'path'
import { generateTypeScriptTypes, GenerateTypescriptOptions } from "graphql-schema-typescript"

const schemaPath = path.join(__dirname, "./mock.graphql");
const outputPath = path.join(__dirname, "generatedTypes");

describe("Test Should generate Typescript types", () => {

    test("it should log types to the cli", async () => {
        const apiOptions: GenerateTypescriptOptions = {}

        const schema = await generateTypeScriptTypes(schemaPath, outputPath, apiOptions)
        console.log(schema);
    })
})