import container from "../inversify.config";

export function repo(modelConstructor: any) {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const RepoClass = class extends constructor {
            constructor (...args: any[]) {
                super(container.get(modelConstructor), ...args);
            }
        };
        container.bind(RepoClass).toConstantValue(new RepoClass());
        return RepoClass;
    }
}
