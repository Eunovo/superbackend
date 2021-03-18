import { compare } from "bcrypt";
import { UnauthorisedError } from "../../errors";
import { Repository } from "../../repositories";
import { CRUDService } from "../../crud";


/**
 * This class adds Username and Password
 * Authentication to the Service
 */
export class AuthService extends CRUDService {

    async authenticate(username: string, password: string) {
        let args = await this.runPreMiddleware(
            'authenticate', { username, password });
        const { usernameField, passwordField } = args;
        username = args.username;
        password = args.password;

        const user = await this.repo
            .findOne({ [usernameField]: username });

        if (!user) throw new UnauthorisedError();

        const isMatch = await compare(user[passwordField], password);
        if (isMatch)
            throw new UnauthorisedError();

        args = await this.runPostMiddleware(
            'authenticate', { ...args, user });

        return args.user;
    }

}
