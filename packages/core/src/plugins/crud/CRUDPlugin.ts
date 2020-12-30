import { CRUDService } from ".";
import { Plugin } from "../../Plugin";

export const CRUDPlugin: Plugin = (node, repo, service) => {
    const crudService = new CRUDService(service, node.name, repo);
    return { ...service, crudService };
}
