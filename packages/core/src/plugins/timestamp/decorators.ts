import { createMetadataDecorator, Field, Model } from "../../model";
import { CRUDService } from "../../crud";
import container from "../../inversify.config";

export function createdAt() {
    return function (target: any, propertyKey: string) {
        createMetadataDecorator('createdAt')(target, propertyKey);
        createMetadataDecorator('immutable')(target, propertyKey);
    }
}

export function lastUpdatedAt() {
    return createMetadataDecorator('lastUpdatedAt');
}

export function timestamp(modelConstructor: any) {
    const model: Model = container.get(modelConstructor);

    return function (constructor: any) {
        const service = container.get(constructor) as CRUDService;
        service.pre(
            'create',
            (_: string, input: any, context: any, ...args: any[]) => {
                input = model.fields.reduce((acc: any, field: Field) => {
                    if (field.getMetadataBy('createdAt') || field.getMetadataBy('lastUpdatedAt'))
                        return { ...acc, [field.propertyKey]: new Date() };
                    return acc;
                }, input);

                return [input, context, ...args];
            }
        );

        service.pre(
            ['updateOne', 'updateMany'],
            (_: string, input: any, filter: any, context: any, ...args: any[]) => {
                input = model.fields.reduce((acc: any, field: Field) => {
                    if (field.getMetadataBy('lastUpdatedAt'))
                        return { ...acc, [field.propertyKey]: new Date() };
                    return acc;
                }, input);


                return [input, filter, context, ...args];
            }
        );
    }
}
