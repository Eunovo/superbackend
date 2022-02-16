import { FIELDS } from "./MODELS";

/**
 * A decorator factory that stores the metadata for a marked field
 * @param name 
 * @param value @default true 
 * @returns
 */
export function createMetadataDecorator(name: string, value: any = true) {
    return function (target: any, propertyKey: string) {
        FIELDS[target._fieldKey]?.[propertyKey]?.addMetadata(name, value);
    }
}

export function getArrayType(type: string) {
    const isArrayType = type.startsWith('[') && type.endsWith(']');
    if (!isArrayType) return null;
    return type.substring(1, type.length - 1);
}

export function parseToSchemaEnums(type: any) {
    if (type instanceof String)
        return type.split('|').map((v) => v.trim());

    return Object.values(type).filter(v => v instanceof String);
}
