export interface Repository {
 
    create(data: any): Promise<string>;

    findOne(filter: any): Promise<any | null>;

    findMany(filter: any, options?: FilterOptions): Promise<any[]>;

    updateOne(filter: any, data: any): Promise<void>;

    updateMany(filter: any, data: any): Promise<void>;

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
