export interface Repository<T = any> {
 
    create(data: T): Promise<string>;

    findOne(filter: any): Promise<T | null>;

    findMany(filter: any, options?: FilterOptions): Promise<T[]>;

    updateOne(filter: any, data: Partial<T>): Promise<void>;

    updateMany(filter: any, data: Partial<T>): Promise<void>;

    removeOne(filter: any): Promise<void>;

    removeMany(filter: any): Promise<void>;

}

/**
 * DB Filter Options
 */
export interface FilterOptions {
    /**
     * 
     */
    limit?: number;
    
    /**
     * 
     */
    skip?: number;
}

export type DB_ANNOTATIONS = "default" | "unique" | "immutable" | "index";
