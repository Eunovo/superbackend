import { createMetadataDecorator } from "../../model";

export function username() {
    return createMetadataDecorator('username');
}

export function password() {
    return createMetadataDecorator('password');
}
