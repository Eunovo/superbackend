import "jest";
import {
    CRUDService, model, field, userGroup, authorize,
    Repository, inject, repo, service, accessControl,
    Model, setPermissions, Field
} from "../src";
import container from "../src/inversify.config";
import { Observable } from "../src/Observable";
import { getAccessGroupsFrom } from "../src/plugins/authorization/utils";


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
            .rejects.toThrowError('Unauthorised');
        await storeService
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

    test("it should handle fields that are arrays or objects", () => {
        const model = new Model('test', {
            allowed: new Field('allowed', 'allowed', '[String]'),
            allowedObj: (<any>{
                propertyKey: 'allowedObj',
                type: '',
                isArray: true,
                model: new Model('User', {
                    username: new Field('username', 'username', 'String')
                }),
                getMetadataBy: () => {
                    return {
                        group: 'allowedObj',
                        principalKey: 'username',
                        inputPredicate: (value: any, principalKey: any) => value.username === principalKey,
                        filter: (principalKey: any) => ({ 'allowedObj.username': principalKey })
                    }
                }
            })
        });

        model.getField('allowed')
            .addMetadata(
                'user-group',
                {
                    group: 'allowed',
                    principalKey: 'username'
                });

        const username = 'Novo';
        const groups = getAccessGroupsFrom(
            model, { allowed: [username], allowedObj: [{ username }] }, { username }
        );
        expect(groups).toHaveLength(3);
        expect(groups[1].group).toEqual('allowed');
        expect(groups[1].input).toEqual(true);
        expect(groups[1].filter).toHaveProperty('allowed', username);

        expect(groups[2].group).toEqual('allowedObj');
        expect(groups[2].input).toEqual(true);
        expect(groups[2].filter['allowedObj.username']).toEqual(username);
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

@repo()
class StoreRepo {
    create() { }

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
