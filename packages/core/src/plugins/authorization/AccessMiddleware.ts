import { AccessControllerBuilder } from "./AccessControl";


export class AccessMiddlewareBuilder {

    constructor(
        private accessControllers: Map<string, AccessControllerBuilder>,
        private operation: string,
        private extensions: Map<string, string>,
        private baseRole: string
    ) { }

    build() {
        return async (args: any) => {
            const { context } = args;
            let role = this.baseRole;
            if (context?.principal?.role) {
                role = context.principal.role.toLowerCase();
            }

            const update = this.buildArgs(context.principal, {}, role);

            if (!update.filter && !update.input)
                throw new Error('Unauthorised');

            if (args.filter) {
                Object.keys(args.filter)
                    .forEach((key: string) => {
                        if (update.filter?.[key] === undefined) return;
                        args.filter[key] = update.filter[key];
                    });
                if (update.filter.$or)
                    args.filter.$or = update.filter.$or;
            }

            if (args.input) {
                args.input = { ...args.input, ...update.input };
            }
        }
    }

    buildArgs(principal: any, args: any, role: string) {
        const extended = this.extensions.get(role as string) || this.baseRole;
        if (extended && role !== extended) {
            args = this.buildArgs(principal, args, extended);
        }
        const builder = this.accessControllers.get(role);
        if (builder) {
            args = builder.build(this.operation)
                .limitAccess(principal, args);
        }
        return args;
    }

}
