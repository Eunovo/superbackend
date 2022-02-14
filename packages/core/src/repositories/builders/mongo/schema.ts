import { Schema } from "mongoose";
import { Model, Field } from "../../../model/Model";

/**
 * Build the mongoose schema for
 * @param model 
 */
export function buildSchema(model: Model): Schema {
    return new Schema(
        model.fields.reduce((prev, field: Field) => {
            if (field.name === '_id') return prev;
            return { ...prev, [field.name]: getDefinition(field) };
        }, {})    
    );
}

/**
 * Return the `SchemaDefinition` for @param field
 */
function getDefinition(field: Field) {
    const definition: any = {
        type: field.type
    };

    [
        'required',
        'unique',
        'default',
        'immutable'
    ].forEach((name) => {
        const value = field.getMetadataBy(name);
        definition[name] = value;
    });

    const enums = field.getMetadataBy('enum');
    if (enums) definition.enums = parseToSchemaEnums(enums);

    const arrayType = getArrayType(definition.type);
    if (arrayType !== null) {
        return [{ ...definition, type: arrayType }]
    }

    return definition;
}

function getArrayType(type: string) {
    const isArrayType = type.startsWith('[') && type.endsWith(']');
    if (!isArrayType) return null;
    return type.substring(1, type.length - 1);
}

function parseToSchemaEnums(type: any) {
    if (type instanceof String)
        return type.split('|').map((v) => v.trim());

    return Object.values(type).filter(v => v instanceof String);
}
