import { extendService, Plugin } from "../Plugin";
import { AuthService } from "./UsernamePasswordAuthService";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { Field, Model } from "../../Model";
import { Models, Repositories, Services } from "../../utils";


export class UsernamePasswordAuthPlugin extends Plugin {

    transformServices(models: Models, repos: Repositories, services: Services) {
        Object.keys(models)
            .forEach((name) => {
                services[name] = this.getAuthService(
                    models[name], repos[name], services[name])
            });
    }

    private getAuthService(model: Model, repo: Repository, service: Service) {
        const isAuthEnabled = model.metadata
            .find(({ name }) => name === 'usernamepasswordauth');
        if (!isAuthEnabled)
            return service;

        let usernameField: Field | undefined;
        let passwordField: Field | undefined;
        Object.values(model.fields)
            .forEach((field) => {
                let usernameCheck = field.metadata
                    .find(({ name }) => name === 'username');
                let passwordCheck = field.metadata
                    .find(({ name }) => name === 'password');

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
