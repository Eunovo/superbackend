import {
    getNamedType,
    getNullableType,
    GraphQLEnumType,
    GraphQLField,
    GraphQLNamedType,
    GraphQLObjectType,
    GraphQLType,
    isCompositeType,
    isEnumType,
    isListType,
    isNonNullType
} from "graphql";
import { Schema, SchemaTypes } from "mongoose";
import { extractMetadata, isModel } from "../../../utils";

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
    const definition: any = {};
    let type = field.type;

    if (isNonNullType(field.type)) {
        definition.required = true;
        type = getNullableType(field.type);
    }

    definition.type = getSchemaType(type);

    if (isEnumType(getNamedType(type))) {
        definition.enum = (<GraphQLEnumType>type)
            .getValues().map((value) => value.name);
    }

    if (isModel(getNamedType(type))) {
        definition.ref = (<GraphQLNamedType>type).name;
    }

    const metadata = extractMetadata(field.description || "");
    metadata.forEach(({ name, value }) => {
        definition[name] = value;
    });

    return definition;
}

function getSchemaType(type: GraphQLType): any {
    if (isListType(type)) {
        return [getSchemaType(getNamedType(type))];
    }

    if (isCompositeType(type)) {
        type = getNamedType(type);

        if (isModel(type)) return SchemaTypes.ObjectId;
        if (isEnumType(type)) return SchemaTypes.String;

        return SchemaTypes.Mixed;
    }

    switch (type.toString().toLowerCase()) {
        case 'id':
            return SchemaTypes.ObjectId;

        case 'boolean':
            return SchemaTypes.Boolean;

        case 'int':
        case 'float':
            return SchemaTypes.Number;
    
        default:
            return SchemaTypes.String;
    }
}
