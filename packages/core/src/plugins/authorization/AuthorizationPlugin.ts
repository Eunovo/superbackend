import { GraphQLEnumType, GraphQLObjectType, GraphQLSchema, isEnumType } from "graphql";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { extractMetadata, Models } from "../../utils";
import { Plugin } from "../Plugin";

export class AuthorizationPlugin extends Plugin {

    private accessRules: Map<string, any>;

    constructor(schema: GraphQLSchema, models: Models) {
        super(schema, models);

        const rolesType = schema.getType('Role');
        if (!rolesType || !isEnumType(rolesType))
            throw new Error("Role must be defined for authorization to work");

        this.accessRules = this.parseAccessRules(models, rolesType);
    }

    private parseAccessRules(models: Models, rolesType: GraphQLEnumType) {
        const accessRules = new Map();

        rolesType.getValues()
            .forEach((role) => {
                const metadata = extractMetadata(role.description || '');
                metadata.forEach(({ name, args }) => {
                    const [modelName, fieldName] = args;
                    const methodRules: any = accessRules.get(modelName) || {};
                    const roleName = role.name.toLowerCase();

                    const setRulesFor = (method: string) => {
                        methodRules[method] = {
                            ...methodRules[method],
                            [roleName]: [
                                ...(methodRules[method]?.[roleName] || []),
                                { field: models[modelName].fields[fieldName] }
                            ]
                        };
                    }

                    if (name === 'read') {
                        setRulesFor('findBy');
                        setRulesFor('findOne');
                    } else {
                        setRulesFor(name);
                    }

                    accessRules.set(modelName, methodRules);
                });
            });

        return accessRules;
    }

    transformService(node: GraphQLObjectType, repo: Repository, service: Service) {
        const modelAccessRules = this.accessRules.get(node.name);

        if (!modelAccessRules) return service;

        Object.keys(modelAccessRules).forEach((key) => {
            const accessRules = modelAccessRules[key];
            service.pre(key, accessMiddleware(accessRules));
        });

        return service;
    }

}

function accessMiddleware(accessRules: any) {
    return async (context: any, data: any, ...args: any[]) => {
        if (!context.principal) throw new Error('Unauthorised');
        const principal = context.principal;

        if (!principal.role) throw new Error('Unauthorised');

        const roleAccessRules = accessRules[principal.role.toLowerCase()];
        const isAllowed = roleAccessRules.reduce((prev: boolean, rule: any) => {
            const { name, foreignKey } = rule.field;
            return prev && (principal[foreignKey] === data[name]);
        }, true);

        if (!isAllowed) throw new Error('Unauthorised');

        return [context, data, ...args];
    }
}
