export interface Repository {
 
    create(data: any): Promise<string>;

    findOne(filter: any): Promise<any | null>;

    findMany(filter: any, options?: any): Promise<any[]>;

    updateOne(filter: any, data: any): Promise<void>;

    updateMany(filter: any, data: any): Promise<void>;

    removeOne(filter: any): Promise<void>;

    removeMany(filter: any): Promise<void>;

}
