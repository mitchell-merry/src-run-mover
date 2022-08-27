import 'dotenv/config';
import * as SRC from "src-ts";
import * as _data from "./data.json";
import fs from 'fs';
import { PostRun, SendGuest } from 'src-ts';
import { assert } from 'console';

const ids = require('../DATA/from_ids.json');

interface LeaderboardPartial {
	game: string;
	category: string;
	level?: string;
	variables: SRC.PostRun['variables'];
}

assert(process.env['API-KEY']);

(async () => {

const data = _data.to as LeaderboardPartial;

await Promise.all(ids.map(async id => {
	const run = await SRC.getRun(id) as Omit<SRC.Run, 'players'> & { players: SRC.RunPlayer[] };
	if(SRC.isError(run)) throw new Error(run.message);

	const postRun: PostRun = {
		category: data.category,
		level: data.level ?? undefined,
		date: run.date ?? undefined,
		region: run.system.region ?? undefined,
		platform: run.system.platform ?? '8gej2n93', // PC
		verified: true,
		times: {
			realtime: run.times.realtime_t ?? undefined,
			realtime_noloads: run.times.realtime_noloads_t ?? undefined,
			ingame: run.times.ingame_t ?? undefined
		},
		players: run.players.map(player => {
			return player.rel === "guest" ? {
				rel: "guest",
				name: player.name
			} as SRC.SendGuest : {
				rel: "user",
				id: player.id
			} as SRC.SendUser;
		}),
		emulated: run.system.emulated,
		video: run.videos?.links?.[0].uri ?? undefined,
		comment: run.comment ?? '',
		splitsio: run.splits?.uri,
		variables: data.variables
	};

	await SRC.submitRun(postRun, process.env['API-KEY']!);
	console.log('done ' + id);
}));
console.log('done');
})();
