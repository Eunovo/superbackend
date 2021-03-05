import { MapAll, Models, Repositories } from "../../utils";
import { CRUDService } from "../../crud";
import { Plugin } from "../Plugin";

export class RelationshipPlugin extends Plugin {

    transformServices(models: Models, _repos: Repositories, services: MapAll<any, CRUDService>) {
        Object.values(models)
            .forEach(model => {
                const { name, fields } = model;
                const service = services[name];

                Object.values(fields)
                    .forEach(field => {
                        if (!field.foreignModel) return;
                        const foreignService = services[field.foreignModel];

                        if (!foreignService)
                            throw new Error(
                                `CRUDService for ${field.foreignModel} ` +
                                `must exist before relationships can be formed`
                            );

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

                        service.pre(
                            ['create', 'updateOne', 'updateMany'],
                            fetchForeigners
                        );
                    });
            });
    }

}
