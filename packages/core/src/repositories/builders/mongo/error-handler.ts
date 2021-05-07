import { Error } from "mongoose";
import { InputError } from "../../../errors";


function getValidationErrorMessage(error: Error.ValidatorError) {
    switch (error.kind) {
        case 'required':
            return `${error.path} is required`;

        case 'regexp':
            return `${error.value} is invalid for ${error.path}`;

        default:
            return `${error.kind} for ${error.path} was unexpected`;
    }
}

export function handleDuplicateKeyError(error: any) {
    if (error.keyValue) {
        const errors = Object.keys(error.keyValue)
            .map((key) => ({
                name: key, message: `${error.keyValue[key]} already exists`
            }));
        return new InputError(errors, "Validation Errors");
    }
    // We have to extract the value from the message
    const match = error?.message?.match(/".*"/g);
    return new InputError([], `${match[0]} already exists`);
}

export function handleValidationError(error: any) {
    const errors = Object.keys(error.errors)
        .map((key) => (error.errors[key as any]))
        .map((validationError) => {
            if (validationError instanceof Error.ValidatorError) {
                return {
                    name: validationError.path,
                    message: getValidationErrorMessage(validationError)
                };
            }
            const castError = validationError as unknown as Error.CastError;
            return {
                name: castError.path,
                message: `Cast to ${castError.kind} failed for '${castError.value}'`
            };
        });
    return new InputError(errors, "Validation Errors");
}

export function handleMongooseError(error: any, docs: any, next: any) {
    if (error.name !== 'MongoError' && !(error instanceof Error)) {
        next(error);
        return;
    }

    if (error.code === 11000) {
        next(handleDuplicateKeyError(error));
    } else if (error instanceof Error.ValidationError) {
        next(handleValidationError(error));
    } else {
        next(error);
    }
}
