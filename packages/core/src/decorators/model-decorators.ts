import { Model, Field } from "../NewModel";

export function model(name?: string) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        return class extends constructor {
            _model = new Model(name ?? constructor.name);
        };
    }
}

export function field(name: string, type: string) {
    return function (target: any, propertyKey: string) {
        if (!target._model) throw new Error("Class is not a model");

        const field = new Field(name ?? propertyKey, type);
        (target._model as Model).addField(propertyKey, field);
    }
}

function createMetadataDecorator(name: string, value: any = true) {
    return function (target: any, propertyKey: string) {
        if (!target._model) throw new Error("Class is not a model");

        (target._model as Model).getField(propertyKey).addMetadata(name, value);
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

export function oneToOne(modelName: string, key: string) {
    return createMetadataDecorator('link', { modelName, key });
}
