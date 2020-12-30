import { Repository } from "../../repositories";
import { Service } from "../../Service";

export type CRUDType = {}

export class CRUDService extends Service {
    constructor(
        private name: string,
        private repo: Repository
    ) {
        super();
    }
    
    create(input: any) {

    }

    findOne(filter: any) {

    }

    findBy(filter: any, options: any) {

    }

    updateOne(input: any, filter: any) {

    }

    updateMany(input: any, filter: any) {

    }

    removeOne(filter: any) {

    }

    removeMany(filter: any) {

    }

}
