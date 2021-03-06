export class Rules {
    private fieldsMap: Map<string, FieldAccessController>;

    constructor() {
        this.fieldsMap = new Map();
    }

    all(allow: boolean = true) {
        this.set('*', allow);
    }

    field(name: string) {
        return this.fieldsMap.get(name);
    }

    fields() {
        return this.fieldsMap.values();
    }

    set(name: string, allow: boolean = true) {
        this.fieldsMap.set(
            name, new FieldAccessController(name, allow)
        );

        if (name !== '*' && Boolean(this.fieldsMap.get('*')?.isAllowed()) !== allow) {
            // this.fieldsMap.delete('*');
        }

        if (name === '*') {
            const iter = this.fieldsMap.keys();
            let next = iter.next()

            while (!next.done) {
                const key = next.value;
                const value = Boolean(this.fieldsMap.get(key)?.isAllowed());
                if (value !== allow && key !== name) {
                    this.fieldsMap.delete(key);
                }

                next = iter.next();
            }
        }
    }
}

export class FieldAccessController {

    constructor(
        private name: string,
        private allow: boolean
    ) { }

    authorize(input: any, subject: string) {
        return this.allow ? input === subject : input !== subject;
    }

    canView() {
        return true;
    }

    /**
     * Returns restricted filter or `false` is access is denied
     * @param subject 
     */
    filter(subject: string) {
        if (this.name === '*') // refers to 'all' fields
            return this.allow ? {} : false;

        return this.allow ? { [this.name]: subject }
            : { [this.name]: { $ne: subject } };
    }

    getName() {
        return this.name;
    }

    isAllowed() {
        return this.allow;
    }

}
