import { MapAll } from "../utils";

class Metadata {
    private _metadata: any;
    constructor(metadata: any) {
        this._metadata = metadata;
    }

    get metadata() {
        return Object.keys(this._metadata).map((key) => ({
            name: key,
            value: this._metadata[key]
        }))
    }

    addMetadata(name: string, value: any) {
        this._metadata = {
            ...this._metadata,
            [name]: value
        }
    }

    getMetadataBy(name: string) {
        return this._metadata[name];
    }
}


export class Model extends Metadata {
    private _name: string
    private _fields: MapAll<any, Field>

    constructor(name: string, fields: MapAll<any, Field>) {
        super({});
        this._name = name;
        this._fields = fields;
    }

    get name() { return this._name }
    get fields() { return Object.values(this._fields) }

    addField(field: Field) {
        this._fields = {
            ...this._fields,
            [field.propertyKey]: field
        }
    }

    getField(name: string) { return this._fields[name] }
}

export class Field extends Metadata {
    private _name: string;
    private _propertyKey: string;
    private _type: string;

    constructor(name: string, propertyKey: string, type: string) {
        super({});
        this._name = name;
        this._propertyKey = propertyKey;
        this._type = type;
    }

    get name() { return this._name }
    get propertyKey() { return this._propertyKey }
    get type() { return this._type }
}
