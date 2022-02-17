import { compare, hash } from "bcrypt";
import { UnauthorisedError } from "../../errors";
import { CRUDService } from "../../crud";
import { Model } from "../../model";
import { Repository } from "../../repositories";
import { Observable } from "../../Observable";

const SALT_ROUNDS = 10;

/**
 * This class adds Username and Password
 * Authentication to the Service
 */
export class AuthService<T = any> extends CRUDService<T> {
    private usernameField!: string;
    private passwordField!: string;
    protected model?: Model;

    constructor(
        observable: Observable,
        repo: Repository<T>,
    ) {
        super(observable, repo);
        
        this.model?.fields.forEach((field) => {
            if (field.getMetadataBy('username'))
                this.usernameField = field.name;
            if (field.getMetadataBy('password'))
                this.passwordField = field.name;
        });
        this.pre(
            ['create', 'updateOne', 'updateMany'],
            async (_, input: any, ...args: any[]) => {
                if (!input[this.passwordField]) return [input, ...args];

                const password = input[this.passwordField];
                const hashedPassword = await hash(password, SALT_ROUNDS);

                return [{ ...input, [this.passwordField]: hashedPassword }, ...args];
            });
    }

    async authenticate(username: string, password: string) {
        const { usernameField, passwordField } = this;

        const user = await this.repo
            .findOne({ [usernameField]: username });

        if (!user || !password || !(user as any)[passwordField]) throw new UnauthorisedError();

        const isMatch = await compare(password, (user as any)[passwordField]);
        if (!isMatch)
            throw new UnauthorisedError();

        return user;
    }

}
