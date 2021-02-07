import { Field } from "../../Model";

export interface AccessController {
    limitAccess(principal: any, args: any): any
}

interface FilterItem {
    field: string;
    value(principal: any): any;
}

export class AccessControllerBuilder {

    private filters: Map<string, FilterItem[]> = new Map();
    private all: Map<string, string> = new Map();

    allowAll(operation: string) {
        this.all.set(operation, "ALLOW");
    }

    disallowAll(operation: string) {
        this.all.set(operation, "DISALLOW");
    }

    fixed(operation: string, field: Field, value: any) {
        const limiter = {
            field: field.name,
            value: () => value
        };

        this.filters.set(
            operation, [
            ...this.filters.get(operation) || [],
            limiter
        ]);
        this.all.set(operation, "");
    }

    variable(operation: string, field: Field, matchAgainstSelf: boolean = false) {
        const limiter = {
            field: field.name,
            value: (principal: any) => {
                if (matchAgainstSelf)
                    return principal[field.name];

                if (!field.foreignKey) {
                    throw new Error(
                        `${field.name} must be part of principal or must` +
                        ` have a foreign key to the principal`);
                }
                // TODO check that foreign model is principal

                return principal[field.foreignKey];
            }
        };

        this.filters.set(
            operation, [
            ...this.filters.get(operation) || [],
            limiter
        ]);
        this.all.set(operation, "");
    }

    build(operation: string): AccessController {
        return {
            limitAccess: (principal: any, args: any) => {
                if (this.all.get(operation) === "ALLOW") {
                    return {
                        ...args,
                        filter: {},
                        input: {}
                    }
                }

                if (this.all.get(operation) === "DISALLOW") {
                    return { ...args, filter: undefined, input: undefined };
                }

                if (!this.filters.get(operation) || this.filters.get(operation)?.length === 0)
                    return args;

                let modifiedArgs = {};

                const orFilter = this.filters.get(operation)
                    ?.reduce((prev: any, cur: FilterItem) => {
                        return [...prev, { [cur.field]: cur.value(principal) }];
                    }, []);

                const filters = this.filters.get(operation)
                    ?.reduce((prev: any, cur: FilterItem) => {
                        return { ...prev, [cur.field]: cur.value(principal) };
                    }, {}) || {};

                modifiedArgs = {
                    ...args,
                    filter: { ...args.filter, ...filters, $or: orFilter },
                    input: { ...args.input, ...filters },
                };
                return modifiedArgs;
            }
        }
    }
}
