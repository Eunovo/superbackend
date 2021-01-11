import { Model } from "../../Model";
import { Repository } from "../../repositories";
import { Service } from "../../Service";
import { Models, Repositories, Services } from "../../utils";
import { Plugin } from "../Plugin";

export class RelationshipPlugin extends Plugin {

    transformServices(models: Models, repos: Repositories, services: Services) {
        Object.values(models)
            .forEach(model => {
                const { name, fields } = model;
                const service = services[name];

                Object.values(fields)
                    .forEach(field => {
                        if (!field.foreignModel) return;
                        const foreignService: any = services[field.foreignModel];

                        const fetchForeigners = async (args: any) => {
                            args._foreign = {};
                            const { name, foreignKey } = field;
                            const input = args.input;
                            if (!foreignKey || !input[name]) return;

                            args._foreign[name] = await foreignService
                                .findOne({ [foreignKey]: input[name] });
                        };

                        service.pre('create', fetchForeigners);
                        service.pre('updateOne', fetchForeigners);
                        service.pre('updateMany', fetchForeigners);
                    });
            });
    }

}
