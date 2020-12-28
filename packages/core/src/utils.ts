import { GraphQLObjectType, GraphQLSchema } from "graphql";

export function extractModelsFrom(gqlSchema: GraphQLSchema): GraphQLObjectType[] {
    const typeMap = gqlSchema.getTypeMap();
    return Object.keys(typeMap)
        .reduce((prev: any, key: string) => {
            const node = typeMap[key];
            if (node.astNode?.kind !== 'ObjectTypeDefinition') return prev;
            return [...prev, node];
        }, []);
}
