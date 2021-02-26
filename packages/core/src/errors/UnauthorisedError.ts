export class UnauthorisedError extends Error {
    constructor(message: string = "Unauthorised") {
        super(message);
        Object.setPrototypeOf(this, UnauthorisedError.prototype);
    }
}