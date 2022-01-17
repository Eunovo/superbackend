import { getParameters } from "../decorators";
import container from "../inversify.config";

export function repo() {
    return function <T extends { new(...args: any[]): {} }>(constructor: T) {
        const params = getParameters();
        container.bind(constructor).toConstantValue(new constructor(...params));
    }
}
