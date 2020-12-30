export interface FieldError {
    name: string;
    message: string;
}

export class InputError extends Error {
    public readonly errors: FieldError[];

    constructor(errors: FieldError[], message: string = "Bad Input") {
        super(message);
        this.errors = errors;
        Object.setPrototypeOf(this, InputError.prototype);
    }
}
