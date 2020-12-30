export class NotFoundError extends Error {
    constructor(message: string = "Not Found") {
        super(message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}
