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
    }

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
    
        default:
            return SchemaTypes.String;
    }
}
