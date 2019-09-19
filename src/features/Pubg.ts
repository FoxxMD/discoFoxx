import {Database} from "sqlite";
import {Match, PlatformRegion, Player, PubgAPI, Roster} from 'pubg-typescript-api';
import {GuildMember, Message} from "discord.js";
import Table from 'cli-table3';

export interface pubgEnv {
    token: string,
    acl?: { // roles
        whitelist?: string[],
        blacklist?: string[],
        ops?: string[],
    }
}

export interface pubgUser {
    id: number,
    snowflake: string,
    discordName: string,
    pubId: string,
    pubName: string,
}

export class PubError extends Error {

}

export class Pubg {
    db: Database;
    whitelist: string[];
    blacklist: string[];
    ops: string[];
    api: PubgAPI;

    constructor(db: Database, env: pubgEnv) {
        const {
            token, acl: {
                whitelist = [],
                blacklist = [],
                ops = ['admin']
            } = {}
        } = env;
        this.db = db;
        this.whitelist = whitelist;
        this.blacklist = blacklist;
        this.ops = ops;
        this.createDB().then(() => null);
        this.api = new PubgAPI(token, PlatformRegion.STEAM);
    }

    async setPlayer(user: GuildMember, name: string): Promise<void> {
        const existingUser: (pubgUser | undefined) = await this.db.get('SELECT * from main.pubgUsers where snowflake = ?', user.id);
        const existingName: (pubgUser | undefined) = await this.db.get('SELECT * from main.pubgUsers where pubName = ?', name);

        const player = await this.getPubgPlayerByName(name);

        // if name is already in DB but not for the user we are setting for it for then we need to delete it
        // this assumes we've already done a permissions check in the command to prevent regular users from mucking up everyone else's names
        if (existingName !== undefined && existingName.snowflake !== user.id) {
            await this.db.run('DELETE FROM main.pubgUsers where id = ? ', existingName.id);
        }

        // if the user already exists in the DB then we just update their pubname and pub id
        if (existingUser !== undefined) {
            await this.db.run('UPDATE main.pubgUsers SET pubName = ?, pubId = ? where id = ?', [name, player.id, existingUser.id]);
        } else {
            // otherwise we create a new entry for the user
            await this.db.run('INSERT INTO main.pubgUsers (snowflake, discordName, pubName, pubId) VALUES(?,?,?,?)', [user.id, user.displayName, name, player.id]);
        }
    }

    async pubNameExists(name: string): Promise<[boolean, string?]> {
        const existingRow: (pubgUser | undefined) = await this.db.get('SELECT * FROM main.pubgUsers where pubName = ?', name);
        if (existingRow === undefined) {
            return [false];
        }
        return [true, existingRow.discordName];
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

    private async getPubgUserFromMember(user: GuildMember): Promise<pubgUser> {
        const pubUser = await this.db.get('SELECT * from main.pubgUsers where snowflake = ?', [user.id]);
        if (pubUser === undefined) {
            throw new PubError(`PUBG Username not set for ${user.user.username}, see \`!pub-setuser help\``);
        }
        return pubUser;
    }

    private async getMatch(user: (GuildMember | pubgUser), matchVal?: string) {
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

    async displayGroupMatch(user: GuildMember, matchId?: string): Promise<Function> {
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


        return (m: Message) => {
            const content = `${roster.hasWon ? '**Winner Winner, Chicken Dinner!**\n' : ''}${matchSummary}\n\n${rosterSummary}\n\`\`\`${table.toString()}\`\`\`\n**Replay**: https://pubg-replay.com/match/pc/${match.id}`;
            return m.channel.send(content.substring(0, 2000));
        };
    }

    private matchSummary(match: Match) {
        return `**Map**: ${match.map}\n**Played On**: ${match.dateCreated}\n**Player Count**: ${match.participants.length}`;
    }

    private rosterSummary(roster: Roster) {
        return `Team placed in position **${roster.rank}**`;
    }

    private async createDB() {
        await this.db.run(`CREATE TABLE IF NOT EXISTS
        pubgUsers (
        id INTEGER PRIMARY KEY,
        snowflake text,
        discordName text,
        pubName text,
        pubId text
        );`);
    }
}
