import { GraphQLEnumType, GraphQLSchema, isEnumType } from "graphql";
import { Model } from "../../Model";
import { Service } from "../../Service";
import { extractMetadata, Models, Repositories, Services } from "../../utils";
import { Plugin } from "../Plugin";
import { CreateRule, DeleteRule, ReadRule, Rule, UpdateRule } from "./Rules";

export class AuthorizationPlugin extends Plugin {

    private accessRules: Map<string, any>;

    constructor() {
        super();
        this.accessRules = new Map();
    }

    setup(schema: GraphQLSchema, models: Models) {
        const rolesType = schema.getType('Role');
        if (!rolesType || !isEnumType(rolesType))
            throw new Error("Role must be defined for authorization to work");

        this.accessRules = this.parseAccessRules(models, rolesType);
    }

    transformServices(models: Models, repos: Repositories, services: Services) {
        Object.values(models)
            .forEach((model) => {
                this.applyAccessRules(model, services[model.name]);
            });
    }

    private applyAccessRules(model: Model, service: Service) {
        const modelAccessRules = this.accessRules.get(model.name);

        if (!modelAccessRules) return service;

        Object.keys(modelAccessRules).forEach((key) => {
            const accessRules = modelAccessRules[key];
            service.pre(key, accessMiddleware(accessRules));
        });

        return service;
    }

    private parseAccessRules(models: Models, rolesType: GraphQLEnumType) {
        const accessRules = new Map();

        rolesType.getValues()
            .forEach((role) => {
                const metadata = extractMetadata(role.description || '');
                metadata.forEach(({ name, args }) => {
                    const [modelName, fieldName] = args;
                    const field = models[modelName].fields[fieldName];
                    const methodRules: any = accessRules.get(modelName) || {};
                    const roleName = role.name.toLowerCase();

                    const setRulesFor = (method: string, rule: Rule) => {
                        methodRules[method] = {
                            ...methodRules[method],
                            [roleName]: [
                                ...(methodRules[method]?.[roleName] || []),
                                rule
                            ]
                        };
                    }

                    if (name === 'read') {
                        const readRule = new ReadRule(field);
                        setRulesFor('findMany', readRule);
                        setRulesFor('findOne', readRule);
                    } else if (name === 'update') {
                        const updateRule = new UpdateRule(field);
                        setRulesFor('updateOne', updateRule);
                        setRulesFor('updateMany', updateRule);
                    } else if (name === 'delete') {
                        const deleteRule = new DeleteRule(field);
                        setRulesFor('removeOne', deleteRule);
                        setRulesFor('removeMany', deleteRule);
                    } else {
                        const createRule = new CreateRule(field);
                        setRulesFor(name, createRule);
                    }

                    accessRules.set(modelName, methodRules);
                });
            });

        return accessRules;
    }

}

function accessMiddleware(accessRules: any) {
    return async (args: any) => {
        const { context } = args;
        if (!context.principal) throw new Error('Unauthorised');
        const principal = context.principal;

        if (!principal.role) throw new Error('Unauthorised');

        const roleAccessRules = accessRules[principal.role.toLowerCase()];
        const isAllowed = roleAccessRules
            .reduce(
                (prev: boolean, rule: Rule) =>
                    prev && rule.check(principal, args),
                true
            );

        if (!isAllowed) throw new Error('Unauthorised');
    }
}
