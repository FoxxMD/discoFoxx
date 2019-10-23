import {Entity, IEntity, PrimaryKey, Property} from "mikro-orm";

@Entity()
export class DiscordPubAssociation {

    @PrimaryKey()
    _id!: number;

    @Property()
    snowflake: string;

    @Property()
    discordName: string;

    @Property()
    pubId: string;

    @Property()
    pubName: string;

    constructor(snowflake: string, discordName: string, pubName: string, pubId: string) {
        this.snowflake = snowflake;
        this.discordName = discordName;
        this.pubName = pubName;
        this.pubId = pubId;
    }
}


export interface DiscordPubAssociation extends IEntity<number> {}
