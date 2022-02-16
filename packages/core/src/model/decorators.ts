import container from "../inversify.config";
import { Model, Field } from "./Model";
import { createMetadataDecorator } from "./utils";
import { MODELS, FIELDS } from "./MODELS";

let fieldKey = Symbol("key");

export function model(name: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        MODELS[constructor] = new Model(name, FIELDS[fieldKey]);
        container.bind<Model>(constructor).toConstantValue(MODELS[constructor]);
        fieldKey = Symbol("key");
    }
}

export function getModel<T extends { new(...args: any[]): {} }>(constructor: T) {
    return function(target: any, propertyKey: string, ) {
        target[propertyKey] = container.get(constructor);
    }
}

export function field(name: string, type: any) {
    return function (target: any, propertyKey: string) {
        target._fieldKey = fieldKey;
        const field = new Field(name ?? propertyKey, propertyKey, type);
        FIELDS[fieldKey] = { ...(FIELDS[fieldKey] || {}), [propertyKey]: field };
    }
}

export function unique() {
    return createMetadataDecorator('unique');
}

export function required() {
    return createMetadataDecorator('required');
}

export function immutable() {
    return createMetadataDecorator('immutable');
}

export function defaultValue(value: any) {
    return createMetadataDecorator('default', value);
}

export function enums(value: any) {
    return createMetadataDecorator('enum', value);
}

export function oneToOne(modelName: string, key: string) {
    return createMetadataDecorator('link', { modelName, key });
}
