import { GraphQLSchema, isEnumType } from "graphql";
import { Model } from "../../Model";
import { Service } from "../../Service";
import { extractMetadata, Models, Repositories, Services } from "../../utils";
import { Plugin } from "../Plugin";
import { AccessControllerBuilder } from "./AccessControl";
import { AccessMiddlewareBuilder } from "./AccessMiddleware";

const BASE_ROLE = "*";

/**
 * This plugins add middleware to CRUD methods
 * that restrict the access of principals based
 * on their roles. A principal is a logged in user.
 * Access is defined using the
 * `allow`, `disallow`, `allowOn` and `allowOnMatch` annotationss
 */
export class AuthorizationPlugin extends Plugin {

    private roleExtensions: Map<string, string>;

    constructor() {
        super();
        this.roleExtensions = new Map();
    }

    setup(schema: GraphQLSchema, models: Models) {
        const rolesType = schema.getType('Role');
        if (!rolesType || !isEnumType(rolesType))
            throw new Error("Role must be defined for authorization to work");

        rolesType.getValues().forEach((role) => {
            const roleMetadata = extractMetadata(role?.description || '');
            roleMetadata.forEach((metadata) => {
                if (metadata.name === 'extends') {
                    const target = metadata.args[0];
                    this.roleExtensions.set(
                        role.name.toLowerCase(), target.toLowerCase());
                }
            });
        });
    }

    transformServices(models: Models, repos: Repositories, services: Services) {
        Object.values(models)
            .forEach((model) => {
                this.applyAccessRules(model, services[model.name]);
            });
    }

    private applyAccessRules(model: Model, service: Service) {
        const accessControllers = this.parseAccessRules(model);

        if (!accessControllers) return service;

        const methodOpMap: any = {
            create: 'create',
            findOne: 'read',
            findMany: 'read',
            updateOne: 'update',
            updateMany: 'update',
            removeOne: 'delete',
            removeMany: 'delete'
        };
        Object.keys(methodOpMap).forEach((key: string) => {
            const operation = methodOpMap[key];
            const middlewareBuilder = new AccessMiddlewareBuilder(
                accessControllers, operation, this.roleExtensions,
                BASE_ROLE
            );
            service.pre(key, middlewareBuilder.build());
        });

        return service;
    }

    /**
     * 
     * @param model 
     * @returns a map of roles to accessControllers
     * for each role
     */
    private parseAccessRules(model: Model) {
        const accessControllers: Map<string, AccessControllerBuilder> = new Map();

        const allowAll = (role: string, operations: string[]) => {
            const builder = accessControllers.get(role) || new AccessControllerBuilder();
            operations.forEach((operation) => {
                builder.allowAll(operation);
            });

            accessControllers.set(role, builder);
        }
        const disallowAll = (role: string, operations: string[]) => {
            const builder = accessControllers.get(role) || new AccessControllerBuilder();
            operations.forEach((operation) => {
                builder.disallowAll(operation);
            });

            accessControllers.set(role, builder);
        }

        // Allow all access for BASE_ROLE by default
        allowAll(BASE_ROLE, ['create', 'read', 'update', 'delete']);

        let isPrincipal = false;

        model.metadata
            .filter((metadata) => {
                if (metadata.name === 'principal')
                    isPrincipal = true;
                return (metadata.name.includes('allow'));
            })
            .forEach((metadata) => {
                const role = metadata.args[0]?.toLowerCase();
                const operations = metadata.args.slice(1);

                if (metadata.name === 'allow')
                    allowAll(role, operations);
                else if (metadata.name === 'disallow')
                    disallowAll(role, operations);
            });

        Object.values(model.fields).forEach((field) => {
            field.metadata
                .filter((metadata) => metadata.name.includes('allow'))
                .forEach((metadata) => {
                    const args = metadata.args;
                    const role = args[0]?.toLowerCase();
                    const builder = accessControllers.get(role) || new AccessControllerBuilder();

                    if (metadata.name === 'allowon') {
                        const value = args[1];
                        const ops = args.slice(2);
                        ops.forEach((operation) => builder.fixed(operation, field, value));
                    } else if (metadata.name === 'allowonmatch') {
                        const ops = args.slice(1);
                        ops.forEach((operation) => builder
                            .variable(operation, field, isPrincipal));
                    }

                    accessControllers.set(role, builder);
                });
        });

        return accessControllers;
    }

}
