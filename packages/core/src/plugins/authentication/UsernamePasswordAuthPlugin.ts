import { hash } from 'bcrypt';
import { Plugin } from "../Plugin";
import { Field, Model } from "../../Model";
import { Models, Repositories, Services } from "../../utils";

const SALT_ROUNDS = 10;

export class UsernamePasswordAuthPlugin extends Plugin {

    transformServices(models: Models, _repos: Repositories, services: Services) {
        Object.keys(models)
            .forEach((name) => {
                const isAuthEnabled = models[name].metadata
                    .find(({ name }) => name === 'usernamepasswordauth');
                if (!isAuthEnabled) return;

                const [usernameField, passwordField] = this.parse(models[name]);

                services[name].pre('create', async (args: any) => {
                    const password = args.input[passwordField.name];
                    const hashedPassword = await hash(password, SALT_ROUNDS);
                    args.input[passwordField.name] = hashedPassword;
                });

                services[name].pre('authenticate', (args: any) => {
                    args.usernameField = usernameField.name;
                    args.passwordField = passwordField.name;
                });
            });
    }

    private parse(model: Model) {
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
        return [usernameField, passwordField];
    }

}
