import { buildSchema } from "graphql";
import { readFileSync } from "fs";


/**
 * Builds CRUD services for each type in the Schema
 * 
 * @param schemaPath The path to the graphql schema
 */
export function buildServices(schemaPath: string) {
    const schemaString = readFileSync(schemaPath).toString();
    const gqlSchema = buildSchema(schemaString);

    const typeMap = gqlSchema.getTypeMap();
    return Object.keys(typeMap)
        .reduce((prev: any, key: string) => {
            const node = typeMap[key];
            if (node.astNode?.kind !== 'ObjectTypeDefinition') return prev;

            return { ...prev, [node.name]: {} };
        }, {});
}
