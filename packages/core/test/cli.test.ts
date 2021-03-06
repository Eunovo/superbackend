import "jest"
import * as path from 'path'
import { generateTypeScriptTypes, GenerateTypescriptOptions  } from "graphql-schema-typescript"

const schemaPath = path.join(__dirname, "./mock.graphql");
const outputPath = path.join(__dirname, "generatedTypes.d.ts");

describe("Test Should generate Typescript types", () => {

    test("it should generate types from the test schema", async () => {
        const apiOptions: GenerateTypescriptOptions = {
            typePrefix: "SB"
        }
        const schema = await generateTypeScriptTypes(schemaPath, outputPath, apiOptions)
    })
})