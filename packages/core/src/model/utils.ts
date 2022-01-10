import { FIELDS } from "./decorators";

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
