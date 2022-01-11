import container from "./inversify.config";

let injectedParameters: { tag: any, index: number }[] = [];

export function inject(tag: any) {
    return function (target: Object, propertyKey: string | symbol, parameterIndex: number) {
        injectedParameters.push({ tag, index: parameterIndex });
    }
}

export function getParameters() {
    const params = injectedParameters.map(({ tag }) => container.get(tag));
    injectedParameters = [];
    return params;
}
