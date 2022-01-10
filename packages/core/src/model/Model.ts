import { MapAll } from "..";

export class Model {
    private _name: string
    private _fields: MapAll<any, Field>

    constructor(name: string, fields: MapAll<any, Field>) {
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

export class Field {
    private _name: string;
    private _propertyKey: string;
    private _type: string;
    private _metadata: any;

    constructor(name: string, propertyKey: string, type: string) {
        this._name = name;
        this._propertyKey = propertyKey;
        this._type = type;
        this._metadata = {};
    }

    get name() { return this._name }
    get propertyKey() { return this._propertyKey }
    get type() { return this._type }
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
