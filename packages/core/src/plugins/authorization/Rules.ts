import { Field } from "../../Model";

export abstract class Rule {
    constructor(
        protected field: Field
    ) {
        if (!field.foreignKey)
            throw new Error("The target auth field does not have a foreign key");
    }

    abstract check(principal: any, args: any): boolean;
}

export class CreateRule extends Rule {

    check(principal: any, { input }: any) {
        return principal[this.field.foreignKey || '']
            === input[this.field.name];
    }

}

export class ReadRule extends Rule {

    /**
     * Check if principal is allowed to access all
     * data that will be covered by this filter
     * @param principal 
     * @param filter 
     */
    check(principal: any, { filter }: any) {
        // TODO extensive filter check
        return principal[this.field.foreignKey || '']
            === filter[this.field.name];
    }

}

export class UpdateRule extends Rule {

    private writeRule: CreateRule;
    private readRule: ReadRule;

    constructor(
        protected field: Field
    ) {
        super(field);
        this.writeRule = new CreateRule(field);
        this.readRule = new ReadRule(field);
    }

    check(principal: any, args: any) {
        // TODO what if certain data can
        // only be written for certain filters
        return this.readRule.check(principal, args)
            && this.writeRule.check(principal, args);
    }

}

/**
 * I don't see any difference between this
 * and ReadRule
 */
export class DeleteRule extends ReadRule {}
