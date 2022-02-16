import { createMetadataDecorator, Model } from "../../model";
import { CRUDService } from "../../crud";
import { UnauthorisedError } from "../../errors";
import container from "../../inversify.config";
import { getAccessGroupsFrom, makeSafeFilter } from "./utils";
import { Filter } from "../../crud/Filter";

export function accessControl(tag: string) {
    return function (constructor: any) {
        const model: Model = container.get(constructor);
        model.addMetadata('access-tag', tag);
    }
}

export function userGroup(
    group: string, principalKey: string,
    inputPredicate?: (value: any, principal: any) => boolean,
    filter?: (principal: any) => Filter<any>
) {
    return createMetadataDecorator('user-group', { group, principalKey, inputPredicate, filter });
}

type Permissions = {
    [P in keyof any]: {
        create: { [K in keyof any]: any },
        read: { [K in keyof any]: any },
        update: { [K in keyof any]: any },
        delete: { [K in keyof any]: any }
    }
}
let ACCESSPERMISSIONS: Permissions = {}

export function setPermissions(permissions: Permissions) {
    ACCESSPERMISSIONS = permissions;
}

export function authorize(modelConstructor: any) {
    const model: Model = container.get(modelConstructor);

    return function (constructor: any) {
        const service = container.get(constructor) as CRUDService;
        service.pre(
            'create',
            (_: string, input: any, context: any, ...args: any[]) => {
                const modelPermissions = ACCESSPERMISSIONS[model.getMetadataBy('access-tag')];
                const permissions = modelPermissions.create;
                const groups = getAccessGroupsFrom(model, input, context?.principal);
                let canCreate = false;
                groups.forEach(({ group, input }) => {
                    canCreate = canCreate || (permissions[group] && input);
                });

                if (!canCreate)
                    throw new UnauthorisedError();

                return [input, context, ...args];
            }
        );

        service.pre(
            ['findOne', 'findMany', 'removeOne', 'removeMany'],
            (method: string, filter: any, ...args: any[]) => {
                let context = args[0];
                if (method === 'findMany') {
                    context = args[1];
                }

                const modelPermissions = ACCESSPERMISSIONS[model.getMetadataBy('access-tag')];
                const permissions = modelPermissions[
                    method.startsWith('find') ? 'read': 'delete'
                ];
                const groups = getAccessGroupsFrom(model, filter, context?.principal);
                let orFilter: any[] | null = [{ $expr: { $eq: [0, 1] } }];

                groups.forEach(({ group, filter }) => {
                    if (!permissions[group]) return;
                    if (filter === 'all') {
                        orFilter = null;
                        return;
                    }
                    orFilter?.push(filter);
                });

                if (orFilter && orFilter.length > 0) {
                    filter = makeSafeFilter(filter, orFilter);
                }

                return [filter, context, ...args];
            }
        );

        service.pre(
            ['updateOne', 'updateMany'],
            (_: string, input: any, filter: any, context: any, ...args: any[]) => {
                const modelPermissions = ACCESSPERMISSIONS[model.getMetadataBy('access-tag')];
                const permissions = modelPermissions.read;
                const groups = getAccessGroupsFrom(model, filter, context?.principal);
                let orFilter: any[] | null = [];
                let canUpdate = false;

                groups.forEach(({ group, input, filter }) => {
                    if (!permissions[group]) return;

                    canUpdate = canUpdate || input;
                    if (filter === 'all') {
                        orFilter = null;
                        return;
                    }
                    orFilter?.push(filter);
                });

                if (orFilter && orFilter.length > 0) {
                    filter = makeSafeFilter(filter, orFilter);
                }
                if (!canUpdate)
                    throw new UnauthorisedError();

                return [input, filter, context, ...args];
            }
        );
    }
}
