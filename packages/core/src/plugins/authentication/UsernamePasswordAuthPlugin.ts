import { GraphQLField, GraphQLObjectType } from "graphql";
import { extendService, Plugin } from "../Plugin";
import { extractMetadata, getMetadata } from "../../utils";
import { AuthService } from "./UsernamePasswordAuthService";
import { Repository } from "../../repositories";
import { Service } from "../../Service";

export class UsernamePasswordAuthPlugin extends Plugin {

    transformService(node: GraphQLObjectType, repo: Repository, service: Service) {
        if (!getMetadata(node.description || '', 'usernamepasswordauth'))
            return service;

        let usernameField: GraphQLField<any, any> | undefined;
        let passwordField: GraphQLField<any, any> | undefined;
        Object.values(node.getFields())
            .forEach((field) => {
                const metadata = extractMetadata(field.description || '');
                let usernameCheck = metadata.find((value) => value.name === 'username');
                let passwordCheck = metadata.find((value) => value.name === 'password');

                if (usernameCheck) usernameField = field;
                else if (passwordCheck) passwordField = field;
            });

        if (!usernameField) {
            throw new Error("username is not set");
        }
        if (!passwordField) {
            throw new Error("password is not set");
        }

        const authService = new AuthService(usernameField.name, passwordField.name, repo);
        extendService(service, authService);

        return service;
    }

}
