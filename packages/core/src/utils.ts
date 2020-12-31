import { GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from "graphql";

export function extractModelsFrom(gqlSchema: GraphQLSchema): GraphQLObjectType[] {
    const typeMap = gqlSchema.getTypeMap();
    return Object.keys(typeMap)
        .reduce((prev: any, key: string) => {
            const node = typeMap[key];
            if (node.astNode?.kind !== 'ObjectTypeDefinition') return prev;

            if (!isModel(node)) return prev;

            return [...prev, node];
        }, []);
}

interface Metadata {
    name: string;
    args: any[];
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
                    args: [true]
                });
                return;
            }

            let name = token.substring(1, startOfValue).toLowerCase();
            let args: any[] = token.substring(startOfValue + 1, token.indexOf(')')).split(',');

            args = args.map((arg) => {
                if (arg.startsWith("'") || arg.startsWith('"')) {
                    return arg.substring(1, arg.length - 1);
                } else if (arg === 'true' || arg === 'false') {
                    return Boolean(arg);
                }

                return arg;
            });

            metadata.push({ name, args });
        });
    });

    return metadata;
}

export function isModel(type: GraphQLNamedType) {
    const metadata = extractMetadata(type.description || "");
    return metadata.reduce(
        (prev: boolean, cur: Metadata) => prev || cur.name === 'model',
        false
    );
}

/**
 * Extracts the target metadata from the
 * input `description`
 * @param description 
 * @param metadataName The name of the target metadata
 */
export function getMetadata(description: string, metadataName: string) {
    const metadata = extractMetadata(description);
    return metadata.find((value) => value.name === metadataName);
}
