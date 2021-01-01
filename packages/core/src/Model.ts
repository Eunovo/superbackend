import { GraphQLType, GraphQLObjectType, GraphQLField } from "graphql";
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
                [field.name]: new Field(field)
            };
        }, {});
    }

}

export class Field {
    public name: string;
    public type: GraphQLType;
    public metadata: Metadata[];
    public foreignModel?: string;
    public foreignKey?: string;

    constructor(field: GraphQLField<any, any>) {
        this.name = field.name;
        this.type = field.type;
        this.metadata = extractMetadata(field.description || '');
        [this.foreignModel, this.foreignKey] = this.extractForeignKey();
    }

    private extractForeignKey() {
        for (let i in this.metadata) {
            const { name, args } = this.metadata[i];
            if (name === 'manytoone' || name === 'onetomany') {
                return args;
            }
        };

        return [];
    }

}

export interface Metadata {
    name: string;
    args: any[];
}

