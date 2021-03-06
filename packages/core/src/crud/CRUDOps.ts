import { MapAll } from "../utils";

export type CRUD = 'create' | 'read' | 'update' | 'delete';
export type CRUDMiddleware = (
    args: any, method: string, operation: CRUD
) => Promise<void> | void;
export const CRUD_OPERATIONS: MapAll<any, CRUD> =
{
    create: 'create',
    findOne: 'read',
    findMany: 'read',
    updateOne: 'update',
    updateMany: 'update',
    removeOne: 'delete',
    removeMany: 'delete'
};
