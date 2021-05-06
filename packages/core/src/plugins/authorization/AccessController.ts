import { UnauthorisedError } from "../../errors";
import { Rules } from "./Rules";

/**
 * Applies given access rules to Access Control
 */
export class AccessController {

    constructor(
        private rules: Rules
    ) { }

    /**
     * 
     * @param input 
     * @throws UnauthorisedError when the provided inputs
     * violates the access rules
     */
    inputs(input: any, subject: string) {
        const keys = Object.keys(input);
        for (const index in keys) {
            const key = keys[index];

            let granted = this.rules.field(key)
                ?.authorize(input[key], subject);
            // granted = (granted === undefined) ? this.rules.field("*")
            //     ?.isAllowed() : granted;

            if (granted !== undefined && granted === false)
                throw new UnauthorisedError();
        }
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
     * Returns a modified filter that conforms to access rules.
     * Uses `$or` and `$and` to restrict filter.
     * @param filter
     * @throws UnauthorisedError if all access is denied
     */
    filter(filter: any, subject: string) {
        const orFilter = [];
        const andFilter = [];
        const iter = this.rules.fields();
        let next = iter.next();

        while (!next.done) {
            const fieldAC = next.value;
            next = iter.next();

            const clause = fieldAC.filter(subject);
            if (!clause) continue;

            if (fieldAC.isAllowed())
                orFilter.push(clause);
            else andFilter.push(clause);
        }
        
        if (!orFilter.length && !andFilter.length)
            throw new UnauthorisedError();

        const finalFilter = { ...filter };

        if (orFilter.length > 0)
            finalFilter.$or = [...(filter.$or || []), ...orFilter];

        if (andFilter.length > 0)
            finalFilter.$and = [...(filter.$and || []), ...andFilter];

        return finalFilter;
    }

}


