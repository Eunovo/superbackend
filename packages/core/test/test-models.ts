import {
    model, field, username, password,
    MongoRepository, repo, AuthService,
    controller, service, inject,
    accessControl, authorize,
    userGroup, CRUDController,
    getModel, Model, get
} from "../src";
import { Observable } from "../src/Observable";

@accessControl('user')
@model('User')
export class User {
    @userGroup('owner', 'username')
    @username()
    @field('username', 'String')
    username!: string;

    @password()
    @field('password', 'String')
    password!: string;
}

@repo(User)
export class UserRepo extends MongoRepository<User> {}

@authorize(User)
@service()
export class UserService extends AuthService {
    @getModel(User) protected model!: Model;

    constructor(
        @inject(Observable) observable: Observable,
        @inject(UserRepo) repo: UserRepo
    ) {
        super(observable, repo);
    }
}

@controller()
export class UserController extends CRUDController {
    constructor(
        @inject(UserService) service: UserService
    ) {
        super('/users',service);
    }

    @get('/get')
    test(req: any) {
        return super.getMany(req);
    }

}
