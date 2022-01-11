import "jest";
import { CRUDService, model, field, userGroup, authorize, Repository, inject, repo, service, accessControl, setPermissions } from "../src";
import container from "../src/inversify.config";
import { Observable } from "../src/Observable";


describe("Test Authorization", () => {
    test("it should enforce declared access rules", async () => {
        const storeService: any = container.get(StoreService);
        const username = 'novo';
        const impostor = 'bob';

        setPermissions({
            store: {
                create: { owner: true },
                read: { owner: true, admin: true },
                update: {},
                delete: {}
            }
        });

        // test 'USER' role
        let context: any = {
            principal: { username, role: 'user' }
        };

        await expect(storeService
            .create({ owner: impostor }, context))
            .rejects;
        storeService
            .create({ owner: username }, context);

        let filter = await storeService
            .findOne({ owner: impostor }, context);
        expect(filter.$or).toContainEqual({ owner: username });

        // test 'ADMIN' role
        context = {
            principal: { username, role: 'admin' }
        };
        // an ADMIN should be allowed to
        // execute read operation on the entire db
        // as defined in the schema
        filter = await storeService
            .findOne({}, context);
        expect(filter.$or).toBeUndefined();
    });
});

@accessControl('store')
@model('Store')
class Store {
    @field('storeName', 'String')
    storeName!: string

    @userGroup('owner', 'username')
    @field('owner', 'String')
    owner!: string
}

@repo(Store)
class StoreRepo {
    create() {}

    findOne(filter: any) {
        return filter;
    }
}

@authorize(Store)
@service()
class StoreService extends CRUDService {
    constructor(@inject(StoreRepo) repo: Repository) {
        super(new Observable(), repo);
    }
}
