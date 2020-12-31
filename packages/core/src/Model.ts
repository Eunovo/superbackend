import { GraphQLType, GraphQLObjectType } from "graphql";
import { extractMetadata } from "./utils";


type Fields<T = any> = {
    [P in keyof T]: Field
}

export class Model {
    public name: string;
    public fields: Fields;
    public metadata: Metadata[];

    constructor(
        public node: GraphQLObjectType
    ) {
        this.name = node.name;
        this.metadata = extractMetadata(node.description || '');
        const fieldMap = node.getFields();
        this.fields = Object.values(fieldMap).reduce((prev, field) => {
            return {
                ...prev,
                [field.name]: {
                    name: field.name,
                    type: field.type,
                    metadata: extractMetadata(field.description || '')
                }
            };
        }, {});
    }

}

export interface Field {
    name: string;
    type: GraphQLType;
    metadata: Metadata[];
    foreignKey?: String;
}

export interface Metadata {
    name: string;
    args: any[];
}

