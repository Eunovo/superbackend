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
                            const { name, foreignKey } = field;
                            const input = args.input;
                            if (!foreignKey || !input[name]) return;

                            const foreigner = await foreignService
                                .findOne({ [foreignKey]: input[name] }, args.context);
                            args._foreign = {
                                ...(args.foreign || {}),
                                [name]: foreigner
                            }
                        };

                        service.pre('create', fetchForeigners);
                        service.pre('updateOne', fetchForeigners);
                        service.pre('updateMany', fetchForeigners);
                    });
            });
    }

}
