import { AccessController } from "./AccessController";
import { Rules } from "./Rules";

export type Groups<T = any> = {
    [K in keyof T]: OperationGrants
}

/**
 * Manages Access Rules for roles and groups
 */
export class Grants {
    private roles: Map<string, Groups>;

    constructor(
        private roleExtensions: Map<string, string[]>
    ) {
        this.roles = new Map();
    }

    getRoles() {
        return this.roles.keys();
    }

    /**
     * Returns the access grants for a role and group.
     * It selects the group that maps to the give role from `groups`.
     * If a match is not found, the default group, 'any', '*', is applied.
     * @param role 
     * @param groups 
     */
    match(role: string = '*', groups: any = {}) {
        role = role?.toLowerCase();
        groups = Object.keys(groups).reduce((prev, cur) => {
            return { ...prev, [cur.toLowerCase()]: groups[cur] }
        }, {});

        const group = groups[role] || '*';

        return this.role(role, group);
    }

    /**
     * Returns the access grants for a given role and group. 
     * @param role defaults to any, '*'
     * @param group defaults to any, '*'
     */
    role(role: string = "*", group: string = "*") {
        role = role.toLowerCase();
        let roleGroups = this.roles.get(role);

        if (!roleGroups) roleGroups = {};
        if (!roleGroups[group])
            roleGroups[group] = new OperationGrants();

        this.roles.set(role, roleGroups);
        this.resolveInheritance(role);

        return this.roles.get(role)?.[group];
    }

    /**
     * Attempts to find the parent of a role and apply inherited grants.
     * @param role 
     */
    private resolveInheritance(role: string, inherited: string[] = []) {
        const parents = this.roleExtensions.get(role);
        if (parents?.length === 0) return [...inherited, role];

        parents
            ?.forEach(parent => {
                if (inherited.includes(parent)) return;

                inherited = this.resolveInheritance(parent, inherited);
                this.inheritGrants(role, parent);
            });

        return [...inherited, role];
    }


    private inheritGrants(targetRole: string, sourceRole: string) {
        const newGroups: Groups = {};
        [
            this.roles.get(sourceRole),
            this.roles.get(targetRole)
        ].forEach((groups) => {
            if (!groups) return;

            Object.keys(groups).forEach((key) => {
                newGroups[key] = newGroups[key] ? groups[key].extend(newGroups[key])
                    : groups[key];
            });
        });
        this.roles.set(targetRole, newGroups);
    }

}

/**
 * Manages @type Rules for each operation.
 */
class OperationGrants {

    constructor(
        private operations: Map<string, Rules> = new Map()
    ) { }

    /**
     * Initializes an @type AccessController
     * using the rules for this operation.
     * @param operation 
     */
    authorize(operation: string) {
        return new AccessController(this.operation(operation));
    }

    extend(parent: OperationGrants) {
        const childGrants = new OperationGrants();

        [parent, this].forEach((grants) => {
            grants.operations.forEach((rules, op) => {
                let childRules = childGrants.operation(op);

                const iter = rules.fields();
                let next = iter.next();
                while (!next.done) {
                    const fieldAC = next.value;
                    const name = fieldAC.getName();
                    const allow = fieldAC.isAllowed();
                    childRules.set(name, allow);
                    next = iter.next();
                }
            });
        });

        return childGrants;
    }

    operation(operation: string) {
        let rules = this.operations.get(operation);
        if (!rules) {
            rules = new Rules();
            this.operations.set(operation, rules);
        }
        return rules;
    }
}
