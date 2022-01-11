import { Model, Field } from "../..";

export const getAccessGroupsFrom = (model: Model, obj: any, principal?: any) => {
    return model.fields.reduce((acc: any[], field: Field) => {
        if (!principal) return acc;

        const metadata = field
            .getMetadataBy('user-group');
        if (!metadata) return acc;
        
        const { group, matcher } = metadata
        const key = field.propertyKey;
        return [
            ...acc,
            {
                group,
                input: obj[key] === principal[matcher],
                filter: { [key]: principal[matcher] }
            }
        ];
    }, [
        {
            group: principal?.role || 'public',
            input: true,
            filter: 'all'
        }
    ]);
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
        newFilter.$or = [];
    }
    return newFilter;
}
