import { Rules } from "./Rules";

export class AccessController {

    constructor(
        private rules: Rules
    ) { }

    /**
     * 
     * @param input 
     * @returns `false` when the provided inputs
     * violates the access rules and `true` otherwise
     */
    checkInputs(input: any, subject: string) {
        const keys = Object.keys(input);
        for (const index in keys) {
            const key = keys[index];

            let granted = this.rules.field(key)
                ?.authorize(input[key], subject);
            granted = (granted === undefined) ? this.rules.field("*")
                ?.isAllowed() : granted;

            if (granted !== undefined && granted === false)
                return false;
        }
        return true;
    }

    /**
     * Removes all hidden fields
     * @param entity
     */
    purgeFields(entity: any) {
        return Object.keys(entity).reduce((prev: any, cur: string) => {
            if (!this.rules.field(cur)?.canView()) return {};
            return { ...prev, [cur]: entity[cur] };
        }, {});
    }

    /**
     * Modifies a filter to make if conform to access rules.
     * Uses `$or` and `$and` to restrict filter.
     * @param filter
     * @throws UnauthorisedError if all access is denied
     */
    transformFilter(filter: any, subject: string) {
        const orFilter = filter?.$or || [];
        const andFilter = filter?.$and || [];
        const iter = this.rules.fields();
        let next = iter.next();

        while (!next.done) {
            const clause = next.value.filter(subject);

            if (!clause) throw new Error('Unauthorised');

            if (next.value.isAllowed())
                orFilter.push(clause);
            else andFilter.push(clause);

            next = iter.next();
        }

        const finalFilter = { ...filter };

        if (orFilter.length > 0) finalFilter.$or = orFilter;
        if (andFilter.length > 0) finalFilter.$and = andFilter;
        return finalFilter;
    }

}


