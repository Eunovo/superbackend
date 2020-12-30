import { CRUDService } from ".";
import { extendService, Plugin } from "../Plugin";

export const CRUDPlugin: Plugin = (node, repo, service) => {
    const crudService = new CRUDService(node.name, repo);
    extendService(service, crudService);
    return service;
}
