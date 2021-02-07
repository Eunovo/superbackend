import {
    getNamedType,
    getNullableType,
    GraphQLEnumType,
    GraphQLNamedType,
    GraphQLType,
    isCompositeType,
    isEnumType,
    isListType,
    isNonNullType
} from "graphql";
import { Schema, SchemaTypes } from "mongoose";
import { Field, Model } from "../../../Model";
import { isModel } from "../../../utils";

/**
 * Build the mongoose schema for
 * @param model 
 */
export function buildSchema(model: Model): Schema {
    return new Schema(
        Object.values(model.fields).reduce((prev, field: Field) => {
            if (field.name === '_id') return prev;
            return { ...prev, [field.name]: getDefinition(field) };
        }, {})    
    );
}


/**
 * Return the `SchemaDefinition` for @param field
 */
function getDefinition(field: Field) {
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

    field.metadata.forEach(({ name, args }) => {
        definition[name] = args[0];
    });

    return definition;
}


/** 
 * Convert @param type to `SchemaTypes` 
 */
function getSchemaType(type: GraphQLType): any {
    if (isListType(type)) {
        return [getSchemaType(getNamedType(type))];
    }

    if (isEnumType(type)) return SchemaTypes.String;

    if (isCompositeType(type)) {
        type = getNamedType(type);

        if (isModel(type)) return SchemaTypes.ObjectId;

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

        case 'date':
            return SchemaTypes.Date;

        case 'string':
            return SchemaTypes.String;
    
        default:
            return SchemaTypes.Mixed;
    }
}
