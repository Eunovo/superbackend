import { GraphQLNamedType, GraphQLObjectType, GraphQLSchema } from "graphql";
import { Model, Metadata } from "./Model";
import { Repository } from "./repositories";
import { Service } from "./Service";

type MapAll<T = any, Y = any> = {
    [P in keyof T]: Y
}

export type Models<T = any> = MapAll<T, Model>;
export type Repositories<T = any> = MapAll<T, Repository>;
export type Services<T = any> = MapAll<T, Service>;

export function extractModelsFrom(gqlSchema: GraphQLSchema): Models {
    const typeMap = gqlSchema.getTypeMap();
    return Object.keys(typeMap)
        .reduce((prev: any, key: string) => {
            const node = typeMap[key];
            if (node.astNode?.kind !== 'ObjectTypeDefinition') return prev;

            if (!isModel(node)) return prev;

            return {
                ...prev,
                [node.name]: new Model(node as GraphQLObjectType)
            };
        }, {});
}

export function extractMetadata(description: string): Metadata[] {
    const metadata: Metadata[] = [];

    const metadataRegex = new RegExp(/@((\w*\(.*\))|(\w*))/gm);

    description.match(metadataRegex)?.forEach((token) => {

        const startOfValue = token.indexOf('(');
        if (startOfValue === -1) {
            metadata.push({
                name: token.substring(1),
                args: [true]
            });
            return;
        }

        let name = token.substring(1, startOfValue).toLowerCase();
        let args: any[] = token.substring(startOfValue + 1, token.indexOf(')'))
            .split(',');

        args = args.map((arg: string) => {
            arg = arg.trim();
            arg = arg.replace(/'|"/g, '');

            const asInt = Number.parseInt(arg);

            if (arg === 'true' || arg === 'false') {
                return arg === 'true' ? true : false;
            } else if (asInt || asInt === 0) return asInt;

            return arg;
        });

        metadata.push({ name, args });

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
