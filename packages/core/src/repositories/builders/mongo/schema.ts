import {
    getNamedType,
    getNullableType,
    GraphQLField,
    GraphQLObjectType,
    GraphQLType,
    isCompositeType,
    isListType,
    isNonNullType
} from "graphql";
import { Schema, SchemaTypes } from "mongoose";
import { extractMetadata } from "../../../utils";

export function buildSchema(gqlObject: GraphQLObjectType): Schema {
    const fields = gqlObject.getFields();

    return new Schema(
        Object.keys(fields).reduce((prev, key: string) => {
            const field = fields[key];
            
            if (key === '_id') return prev;

            return { ...prev, [key]: getDefinition(field) };
        }, {})    
    );
}

function getDefinition(field: GraphQLField<any, any>) {
    const defintion: any = {};

    if (isNonNullType(field.type)) {
        defintion.required = true;
        const type = getNullableType(field.type);
        defintion.type = getSchemaType(type);
    } else {
        defintion.type = getSchemaType(field.type);
    }

    const metadata = extractMetadata(field.description || "");
    metadata.forEach(({ name, value }) => {
        defintion[name] = value;
    });

    return defintion;
}

function getSchemaType(type: GraphQLType): any {
    if (isListType(type)) {
        return [getSchemaType(getNamedType(type))];
    }

    if (isCompositeType(type)) {
        return SchemaTypes.String;
    }

    switch (type.toString().toLowerCase()) {
        case 'id':
            return SchemaTypes.ObjectId;

        case 'string':
            return SchemaTypes.String;

        case 'boolean':
            return SchemaTypes.Boolean;

        case 'int':
        case 'float':
            return SchemaTypes.Number;
    
        default:
            return SchemaTypes.String;
    }
}
