import 'dotenv/config';
import { assert } from 'console';
import * as SRC from "src-ts";

import { LeaderboardPartial } from './types/types';

const ids = require('../DATA/from_ids.json') as string[];
const data = require('./data.json')['to'] as LeaderboardPartial;

assert(process.env['API-KEY'], 'api');
assert(ids, 'ids');
assert(data, 'data');

const desc_suffix = 
`

===This run was automatically moved===
Original submission date: %subdate%
Original verifier: %verifier%
Original verification date: %verdate%
`;

(async () => {

await Promise.all(ids.map(async id => {
	const run = await SRC.getRun(id) as Omit<SRC.Run, 'players'> & { players: SRC.RunPlayer[] };
	if(SRC.isError(run)) throw new Error(run.message);

	if(run.status.status !== 'verified')
	{
		console.log(`Skipping ${id} as it is not verified... (${run.status.status})`);
		return;
	}

	const original_verifier = await SRC.getUser(run.status.examiner);
	if(SRC.isError(original_verifier)) throw new Error(original_verifier.message);

	const run_suffix = desc_suffix.replace('%subdate%', run.submitted?.replace('T', ' ').replace('Z', ' ') ?? 'unknown')
	                              .replace('%verifier%', `${original_verifier.names.international} (${original_verifier.id})`)
	                              .replace('%verdate%', run.status['verify-date']?.replace('T', ' ').replace('Z', ' ') ?? 'unknown');

	const postRun: SRC.PostRun = {
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
		comment: (run.comment ?? '') + run_suffix,
		splitsio: run.splits?.uri,
		variables: data.variables
	};

	await SRC.submitRun(postRun, process.env['API-KEY']!);
	console.log('done ' + id);
}));
console.log('done');
})();
