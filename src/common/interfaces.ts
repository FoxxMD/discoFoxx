export interface IChannels {
    include?: string[],
    exclude?: string[]
}

export interface PartialMikroOrmOpts {
    dbName: string,
    type: string
};
