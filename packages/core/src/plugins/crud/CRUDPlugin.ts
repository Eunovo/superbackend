import { CRUDService } from ".";
import { Models, Repositories, Services } from "../../utils";
import { extendService, Plugin } from "../Plugin";

export class CRUDPlugin extends Plugin {

    transformServices(models: Models, repos: Repositories, services: Services) {
        Object.keys(models)
            .forEach((name) => {
                const crudService = new CRUDService(
                    name, repos,
                    {
                        ...services,
                        [name]: undefined
                    } as Services
                );
                extendService(services[name], crudService);
            });
    }

}