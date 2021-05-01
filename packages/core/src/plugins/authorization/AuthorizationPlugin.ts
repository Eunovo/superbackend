import { GraphQLSchema, isEnumType } from "graphql";
import { Model } from "../../Model";
import { CRUD_OPERATIONS, CRUDService } from "../../crud";
import { extractMetadata, MapAll, Models, Repositories } from "../../utils";
import { Plugin } from "../Plugin";
import { Grants } from "./Grants";


/**
 * This plugins add middleware to CRUD methods
 * that restrict the access of principals based
 * on their roles. A principal is a logged in user.
 * Access is defined using the
 * `allow` and `deny` annotationss
 */
export class AuthorizationPlugin extends Plugin {

    private roleExtensions: Map<string, string[]>;

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
            // extend the base role by default
            this.roleExtensions.set(role.name.toLowerCase(), ['*']);

            roleMetadata.forEach((metadata) => {
                if (metadata.name === 'extends') {
                    const target = metadata.args[0];
                    const name = role.name.toLowerCase();
                    const parents = this.roleExtensions.get(name) || [];
                    this.roleExtensions.set(
                        name, [...parents, target.toLowerCase()]);
                }
            });
        });
    }

    transformServices(models: Models, repos: Repositories, services: MapAll<any, CRUDService | undefined>) {
        Object.values(models)
            .forEach((model) => {
                const service = services[model.name];
                if (!service) return;
                this.applyAccessRules(model, service);
            });
    }

    private applyAccessRules(model: Model, service: CRUDService) {
        const grants = this.parseAccessRules(model);

        if (!grants) return service;

        Object.keys(CRUD_OPERATIONS).forEach((key: string) => {
            service.pre(key, (args) => {
                args.context.grants = grants;
            })
        });

        return service;
    }

    /**
     * 
     * @param model 
     * @returns Grants
     */
    private parseAccessRules(model: Model) {
        const grants = new Grants(this.roleExtensions);

        // Deny all access by default
        ['create', 'read', 'update', 'delete']
            .forEach((op) => {
                grants.role()?.operation(op).all(false);
            });

        model.metadata
            .filter((metadata) => ['allow', 'deny'].includes(metadata.name))
            .forEach((metadata) => {
                const args = metadata.args;
                const role = args[0]?.toLowerCase();
                const group = args[1]?.toLowerCase();
                const groupGrants = grants.role(role, group);
                const ops = args.slice(2);
                let allow = true;

                if (metadata.name === 'deny') allow = false;

                ops.forEach((op) => groupGrants
                    ?.operation(op).all(allow));
            });

        Object.values(model.fields).forEach((field) => {
            field.metadata
                .filter((metadata) => ['allow', 'deny'].includes(metadata.name))
                .forEach((metadata) => {
                    const args = metadata.args;
                    const role = args[0]?.toLowerCase();
                    const group = args[1]?.toLowerCase();
                    const groupGrants = grants.role(role, group);
                    const ops = args.slice(2);
                    let allow = true;

                    if (metadata.name === 'deny') allow = false;

                    ops.forEach((op) => groupGrants
                        ?.operation(op).set(field.name, allow));
                });
        });

        return grants;
    }

}
