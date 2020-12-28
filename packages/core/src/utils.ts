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

interface Metadata {
    name: string;
    value: any;
}

export function extractMetadata(description: string): Metadata[] {
    const metadata: Metadata[] = [];
    description.split("\n").forEach((token) => {
        token.split(" ").forEach((token) => {
            if (!token.startsWith('@')) {
                return;
            }

            const startOfValue = token.indexOf('(');
            if (startOfValue === -1) {
                metadata.push({
                    name: token.substring(1),
                    value: true
                });
                return;
            }

            let name = token.substring(1, startOfValue);
            let value: any = token.substring(startOfValue + 1, token.indexOf(')'));

            if (value.startsWith("'") || value.startsWith('"')) {
                value = value.substring(1, value.length - 1);
            } else if (value === 'true' || value === 'false') {
                value = Boolean(value);
            }

            metadata.push({ name, value });
        });
    });

    return metadata;
}
