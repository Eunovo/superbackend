import { getParameters } from "../decorators";
import container from "../inversify.config";

export function repo(modelConstructor?: any) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const RepoClass = class extends constructor {
            constructor (...args: any[]) {
                if (modelConstructor)
                    super(container.get(modelConstructor), ...args);
                else
                    super(...args);
            }
        };
        const params = getParameters();
        container.bind(RepoClass).toConstantValue(new RepoClass(...params));
        return RepoClass;
    }
}
