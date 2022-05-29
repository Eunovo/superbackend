import {
    model, field, username, password,
    MongoRepository, repo, UsernamePasswordAuthService,
    controller, service, inject,
    accessControl, authorize,
    userGroup, CRUDController,
    Model, get, CRUDService, requireAuth
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

@repo()
export class UserRepo extends MongoRepository<User> {
    constructor(@inject(User) model: Model) {
        super(model);
    }
}

@service()
export class TestService extends CRUDService {
    constructor() {
        super(({} as any), ({} as any));
    }
}

@authorize(User)
@service()
export class UserService extends UsernamePasswordAuthService {

    constructor(
        @inject(Observable) observable: Observable,
        @inject(UserRepo) repo: UserRepo,
        @inject(User) model: Model
    ) {
        super(observable, repo, model);
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

    @requireAuth()
    @get('/require-auth')
    testRequireAuth(req: any) {
        return super.getMany(req);
    }

}
