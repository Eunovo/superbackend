import { CRUDService } from ".";
import { Model } from "../../Model";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { extendService, Plugin } from "../Plugin";

export class CRUDPlugin extends Plugin {

    transformService(model: Model, repo: Repository, service: Service) {
        const crudService = new CRUDService(model.name, repo);
        extendService(service, crudService);
        return service;
    }

}