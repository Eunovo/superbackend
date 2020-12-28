export interface Repository {
 
    create(data: any): Promise<void>;

    findOne(filter: any): Promise<any>;

    updateOne(filter: any, data: any): Promise<void>;

}
