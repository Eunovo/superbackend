import { compare, hash } from "bcrypt";
import { UnauthorisedError } from "../../errors";
import { CRUDService } from "../../crud";
import { Model, Repository } from "../..";
import { Observable } from "../../Observable";

const SALT_ROUNDS = 10;

/**
 * This class adds Username and Password
 * Authentication to the Service
 */
export class AuthService extends CRUDService {
    private usernameField!: string;
    private passwordField!: string;
    protected model?: Model;

    constructor(
        observable: Observable,
        repo: Repository,
    ) {
        super(observable, repo);
        this.setup();
    }

    async authenticate(username: string, password: string) {
        const { usernameField, passwordField } = this;

        const user = await this.repo
            .findOne({ [usernameField]: username });

        if (!user || !password || !user[passwordField]) throw new UnauthorisedError();

        const isMatch = await compare(password, user[passwordField]);
        if (!isMatch)
            throw new UnauthorisedError();

        return user;
    }

    setup() {
        this.model?.fields.forEach((field) => {
            if (field.getMetadataBy('username'))
                this.usernameField = field.name;
            if (field.getMetadataBy('password'))
                this.passwordField = field.name;
        });
        this.pre(
            ['create', 'updateOne', 'updateMany'],
            async (args: any) => {
                if (!args.input[this.passwordField]) return;

                const password = args.input[this.passwordField];
                const hashedPassword = await hash(password, SALT_ROUNDS);
                args.input[this.passwordField] = hashedPassword;
            });
    }

}
