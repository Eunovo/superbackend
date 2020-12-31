import { GraphQLType, GraphQLObjectType } from "graphql";
import { extractMetadata } from "./utils";

export class Model {
    public name: string;
    public fields: Field[];
    public metadata: Metadata[];

    constructor(
        public node: GraphQLObjectType
    ) {
        this.name = node.name;
        this.metadata = extractMetadata(node.description || '');
        const fieldMap = node.getFields();
        this.fields = Object.values(fieldMap).map((field) => {
            return {
                name: field.name,
                type: field.type,
                metadata: extractMetadata(field.description || '')
            };
        });
    }

}

export interface Field {
    name: string;
    type: GraphQLType;
    metadata: Metadata[];
}

export interface Metadata {
    name: string;
    args: any[];
}

