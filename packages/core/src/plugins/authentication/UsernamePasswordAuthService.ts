import { compare } from "bcrypt";
import { Repository } from "../../repositories";
import { CRUDService } from "../crud";


/**
 * This class adds Username and Password
 * Authentication to the Service
 */
export class AuthService extends CRUDService {

    constructor(
        private usernameField: string,
        private passwordField: string,
        repo: Repository
    ) { super(repo); }

    async authenticate(username: string, password: string) {
        let args = await this.runPreMiddleware(
            'authenticate', { username, password });
        username = args.username;
        password = args.password;

        const user = await this.repo
            .findOne({ [this.usernameField]: username });

        if (!user) throw new Error('Unauthorised');

        const isMatch = await compare(user[this.passwordField], password);
        if (isMatch)
            throw new Error('Unauthorised');

        args = await this.runPostMiddleware(
            'authenticate', { ...args, user });

        return args.user;
    }

}
