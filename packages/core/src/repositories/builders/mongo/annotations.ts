import { Metadata } from "../../../Model";
import { DB_ANNOTATIONS } from "../../Repository";

export const MONGO_ANNOTATIONS: { [P in DB_ANNOTATIONS] : (metadata: Metadata) => any } = {
    default: ({ name, args }) => verifyMetadata({ name, args }, 1) && { default: args[0] },
    unique: () => ({ unique: true }),
    immutable: () => ({ immutable: true }),
    index: () => ({ index: true })
};

function verifyMetadata({ name, args }: Metadata, length: number) {
    if (args.length !== length) {
        throw new Error(`${name} expected at least ${length} arguments but got ${args.length}`);
    }

    return true;
}
