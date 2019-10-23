import {Match, PlatformRegion, Player, PubgAPI, Roster} from 'pubg-typescript-api';
import {GuildMember} from "discord.js";
import Table from 'cli-table3';
import {EntityRepository, MikroORM, SchemaGenerator} from "mikro-orm";
import {DiscordPubAssociation} from "./entities/DiscordPubAssociation";
import {PartialMikroOrmOpts} from "../..";

export interface pubgEnv {
    token: string,
    acl?: { // roles
        whitelist?: string[],
        blacklist?: string[],
        ops?: string[],
    }
}

const defaultOrmOpts = {
    entities: [DiscordPubAssociation],
    entitiesDirsTs: ['./entities'],
    baseDir: __dirname,
};

export class PubError extends Error {

}

export class Pubg {
    orm!: MikroORM;
    assocRepo!: EntityRepository<DiscordPubAssociation>;
    whitelist: string[];
    blacklist: string[];
    ops: string[];
    api: PubgAPI;

    constructor(ormOpts: PartialMikroOrmOpts, env: pubgEnv) {
        const {
            token, acl: {
                whitelist = [],
                blacklist = [],
                ops = ['admin']
            } = {}
        } = env;
        this.whitelist = whitelist;
        this.blacklist = blacklist;
        this.ops = ops;
        this.createDB({...defaultOrmOpts, ...ormOpts}).then(() => null);
        this.api = new PubgAPI(token, PlatformRegion.STEAM);
    }

    async setPlayer(user: GuildMember, name: string): Promise<void> {

        const existingUser = await this.assocRepo.findOne({snowflake: user.id});
        const existingName = await this.assocRepo.findOne({pubName: name});

        const player = await this.getPubgPlayerByName(name);

        // if name is already in DB but not for the user we are setting for it for then we need to delete it
        // this assumes we've already done a permissions check in the command to prevent regular users from mucking up everyone else's names
        if (existingName !== null && existingName.snowflake !== user.id) {
            await this.assocRepo.removeAndFlush(existingName);
        }

        // if the user already exists in the DB then we just update their pubname and pub id
        if (existingUser !== null) {
            existingUser.pubName = name;
            existingUser.pubId = player.id;
            await this.assocRepo.persist(existingUser);
        } else {
            const newUser = new DiscordPubAssociation(user.id, user.displayName, name, player.id);
            await this.assocRepo.persist(newUser);
        }
        await this.assocRepo.flush();
    }

    async pubNameExists(name: string): Promise<[boolean, string?]> {
        const existingUser = await this.assocRepo.findOne({pubName: name});
        if (existingUser === null) {
            return [false];
        }
        return [true, existingUser.discordName];
    }

    hasInteractionPermissions(user: GuildMember): boolean {
        if (this.whitelist.length > 0) {
            return user.roles.some(x => this.whitelist.includes(x.name.toLocaleLowerCase()))
        } else if (this.blacklist.length > 0) {
            return !user.roles.some(x => this.blacklist.includes(x.name.toLocaleLowerCase()))
        }
        return true;
    }

    hasOpsPermissions(user: GuildMember): boolean {
        return user.roles.some(x => this.ops.includes(x.name.toLocaleLowerCase()))
    }

    private async getPubgPlayerByName(name: string): Promise<Player> {
        try {
            const players = await Player.filterByName(this.api, [name]);
            return players[0];
        } catch (e) {
            if ('response' in e && e.response.status === 404) {
                throw new PubError(`No PUBG player found with the name ${name}`);
            }
            throw e;
        }
    }

    private async getPubgUserFromMember(user: GuildMember): Promise<DiscordPubAssociation> {
        const pubUser = await this.assocRepo.findOne({snowflake: user.id});
        if (pubUser === null) {
            throw new PubError(`PUBG Username not set for ${user.user.username}, see \`!pub-setuser help\``);
        }
        return pubUser;
    }

    private async getMatch(user: (GuildMember | DiscordPubAssociation), matchVal?: string) {
        let matchId = matchVal;
        try {
            if (matchId === undefined) {
                const pubUser = 'pubId' in user ? user : await this.getPubgUserFromMember(user);
                const player = await Player.get(this.api, pubUser.pubId);
                matchId = player.matchIds[0];
            }
            return await Match.get(this.api, matchId);
        } catch (e) {
            if ('response' in e && e.response.status === 404) {
                throw new PubError(`The specified Match ${matchId} was not found`);
            }
            throw e;
        }

    }

    async displayGroupMatch(user: GuildMember, matchId?: string): Promise<string> {
        const pubUser = await this.getPubgUserFromMember(user);
        const match = await this.getMatch(pubUser, matchId);
        const roster = match.rosters.find(x => x.participants.some(y => y.playerId === pubUser.pubId));
        if (roster === undefined) {
            throw new PubError(`${user.user.username} was not found in the Match ${match.id}`);
        }
        const matchSummary = this.matchSummary(match);
        const rosterSummary = this.rosterSummary(roster);

        let table = new Table({
            head: ['Name', 'Kills', 'Dmg', 'DBNOs', 'Revives', 'Survived'],
            chars: {
                'top': '', 'top-mid': '', 'top-left': '', 'top-right': ''
                , 'bottom': '', 'bottom-mid': '', 'bottom-left': '', 'bottom-right': ''
                , 'left': '', 'left-mid': '', 'mid': '', 'mid-mid': ''
                , 'right': '', 'right-mid': '', 'middle': ' '
            },
            style: {'padding-left': 0, 'padding-right': 0}
        });
        for (const participant of roster.participants) {
            // @ts-ignore
            table.push([
                `${participant.name.substring(0, 8)}${participant.name.length > 8 ? '...' : ''}`,
                participant.kills,
                Math.round(participant.damageDealt),
                participant.DBNOs,
                participant.revives,
                `${Math.round(participant.timeSurvived / 60)} min`]);
        }

        // const embed = {
        //     "title": `Match ${match.id.substring(0, 20)}...`,
        //     "url": `https://pubg-replay.com/match/pc/${match.id}`,
        //     "timestamp": match.dateCreated.toISOString(),
        //     "description": `**Map**: ${match.map}
        //     **Duration**: ${match.duration} minutes
        //     \`\`\`${table.toString()}\`\`\``
        // };


        const content = `${roster.hasWon ? '**Winner Winner, Chicken Dinner!**\n' : ''}${matchSummary}\n\n${rosterSummary}\n\`\`\`${table.toString()}\`\`\`\n**Replay**: https://pubg-replay.com/match/pc/${match.id}`;
        return content.substring(0, 2000);
    }

    private matchSummary(match: Match) {
        return `**Map**: ${match.map}\n**Played On**: ${match.dateCreated}\n**Player Count**: ${match.participants.length}`;
    }

    private rosterSummary(roster: Roster) {
        return `Team placed in position **${roster.rank}**`;
    }

    private async createDB(opts: any) {
        this.orm = await MikroORM.init(opts);
        this.assocRepo = this.orm.em.getRepository(DiscordPubAssociation);
        const generator = new SchemaGenerator(this.orm.em.getDriver(), this.orm.getMetadata());
        const dump = generator.generate();

        //TODO check if any table exists and if not then create schema

        // await this.db.run(`CREATE TABLE IF NOT EXISTS
        // pubgUsers (
        // id INTEGER PRIMARY KEY,
        // snowflake text,
        // discordName text,
        // pubName text,
        // pubId text
        // );`);
    }
}
