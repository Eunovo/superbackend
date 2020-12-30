import { hash, compare } from "bcrypt";
import { Repository } from "../../repositories";
import { Service } from "../../Service";


const SALT_ROUNDS = 10;

/**
 * This class adds Username and Password
 * Authentication to the Service
 */
export class AuthService extends Service {

    constructor(
        private usernameField: string,
        private passwordField: string,
        private repo: Repository
    ) {
        super();
        
        this.pre('create', async (data: any, ...args: any[]) => {
            const password = data[passwordField];
            const hashedPassword = await hash(password, SALT_ROUNDS);

            return [
                { ...data, [passwordField]: hashedPassword },
                ...args
            ];
        });
    }

    async authenticate(username: string, password: string) {
        const user = await this.repo
            .findOne({ [this.usernameField]: username });

        if (!user) throw new Error('Unauthorised');

        const isMatch = await compare(user[this.passwordField], password);
        if (isMatch)
            throw new Error('Unauthorised');

        return user;
    }

}
