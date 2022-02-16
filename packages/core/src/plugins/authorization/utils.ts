import { Model, Field } from "../../model";

export const getAccessGroupsFrom = (model: Model, obj: any, principal?: any) => {
    const groups = [
        {
            group: 'public',
            input: true,
            filter: 'all'
        }
    ];
    if (principal?.role) {
        groups.push({
            group: principal?.role,
            input: true,
            filter: 'all'
        });
    }

    return model.fields.reduce((acc: any[], field: Field) => {
        if (!principal) return acc;

        const metadata = field
            .getMetadataBy('user-group');
        if (!metadata) return acc;

        const { group, principalKey, inputPredicate, filter } = metadata
        const key = field.propertyKey;
        let input = inputPredicate
            ? inputPredicate(obj, principal[principalKey])
            : obj[key] === principal[principalKey];

        if (field.isArray) {
            input = obj[key].reduce((acc: boolean, val: any) => {
                return acc && (
                    inputPredicate
                        ? inputPredicate(val, principal[principalKey])
                        : val === principal[principalKey]
                );
            }, true);
        }

        return [
            ...acc,
            {
                group,
                input,
                filter: filter
                    ? filter(principal[principalKey])
                    : { [key]: principal[principalKey] }
            }
        ];
    }, groups);
}

export const makeSafeFilter = (filter: any, orFilter: any[]) => {
    const newFilter = { ...filter };
    if (!newFilter['$or']) {
        newFilter['$or'] = orFilter;
    } else {
        newFilter['$and'] = [
            ...(newFilter['$and'] || []),
            { $or: newFilter.$or },
            { $or: orFilter }
        ];
        newFilter.$or = undefined;
    }
    return newFilter;
}
