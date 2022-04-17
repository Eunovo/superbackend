import { Schema } from "mongoose";
import { Model, Field } from "../../../model/Model";
import { parseToSchemaEnums } from "../../../model";

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
    ].filter((name) => field.getMetadataBy(name))
        .forEach((name) => {
            const value = field.getMetadataBy(name);
            definition[name] = value;
        });

    const enums = field.getMetadataBy('enum');
    if (enums) definition.enums = parseToSchemaEnums(enums);

    definition.type = field.model
        ? buildSchema(field.model) : definition.type;

    return field.isArray ? [definition] : definition;
}
