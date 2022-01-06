export class Model {
    private _name: string
    private _fields: { [P in keyof any]: Field }

    constructor(name: string) {
        this._name = name;
        this._fields = {};
    }

    get name() { return this._name }
    get fields() { return Object.values(this._fields) }

    addField(key: string, field: Field) {
        this._fields = {
            ...this._fields,
            [key]: field
        }
    }

    getField(name: string) { return this._fields[name] }
}

export class Field {
    private _name: string;
    private _type: string;
    private _metadata: any;

    constructor(name: string, type: string) {
        this._name = name;
        this._type = type;
        this._metadata = {};
    }

    get name() { return this._name }
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
