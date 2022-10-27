import 'dotenv/config';
import { assert } from 'console';
import * as SRC from "src-ts";

import { LeaderboardPartial } from './types/types';

const ids = require('../DATA/from_ids.json') as string[];
const data = require('./data.json')['to'] as LeaderboardPartial;
const fromdata = require('./data.json')['from'] as LeaderboardPartial;

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

const game = await SRC.getGame(data.game, { embed: "categories.variables" });
const fromgame = await SRC.getGame(fromdata.game, { embed: "categories.variables" });

const fromVars = fromgame.categories.data.find(c => c.id === fromdata.category)!.variables.data;
const toVars = game.categories.data.find(c => c.id === data.category)!.variables.data;

const mutualVariables = fromVars.filter(f => !data.variables[f.id] && toVars.some(t => f.id === t.id));
console.log(mutualVariables);

const mappedVariables = Object.fromEntries(toVars.filter(t => !mutualVariables.some(m => m.id === t.id) && fromVars.some(f => f.name === t.name))
.map(t => {
	const from = fromVars.find(f => f.name === t.name);
	return [ from!.id, {
		toVar: t.id,
		values: Object.fromEntries(Object.entries(from!.values.values).map(([valueId, value]) => [ valueId, Object.entries(t.values.values).find(([tvalueId, tvalue]) => value.label === tvalue.label)?.[0] ]))
	} ]
}));

console.log(JSON.stringify(mappedVariables, null, 4));

await Promise.all(ids.map(async id => {
	const run = await SRC.getRun(id);

	if(run.status.status !== 'verified')
	{
		console.log(`Skipping ${id} as it is not verified... (${run.status.status})`);
		return;
	}

	const original_verifier = await SRC.getUser(run.status.examiner);

	const run_suffix = desc_suffix.replace('%subdate%', run.submitted?.replace('T', ' ').replace('Z', ' ') ?? 'unknown')
	                              .replace('%verifier%', `${original_verifier.names.international} (${original_verifier.id})`)
	                              .replace('%verdate%', run.status['verify-date']?.replace('T', ' ').replace('Z', ' ') ?? 'unknown');

	const prmVars = Object.fromEntries(mutualVariables.map(variable => {
		return [ variable.id, {
			type: variable['user-defined'] ? 'user-defined' : 'pre-defined',
			value: run.values[variable.id]
		} ]
	})) as SRC.PostRun['variables'];

	const mapVars = Object.fromEntries(Object.entries(run.values)
	.filter(([vari, _]) => !!mappedVariables[vari])	
	.map(([vari, valu]) => {
		return [
			mappedVariables[vari].toVar, {
				type: 'pre-defined',
				value: mappedVariables[vari].values[valu]!
			}
		]
	})) as SRC.PostRun['variables']

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
		players: [run.players.map(player => {
			return (player.rel === "guest" ? {
				rel: "guest",
				name: player.name
			} : {
				rel: "user",
				id: player.id
			}) as SRC.PlayerPartial;
		})[0]],
		emulated: run.system.emulated,
		video: run.videos?.links?.[0].uri ?? undefined,
		comment: (run.comment ?? '') + run_suffix,
		splitsio: run.splits?.uri,
		variables: {...(data.variables), ...prmVars, ...mapVars}
	};

	console.log(postRun.variables);
	const res = await SRC.submitRun(postRun, process.env['API-KEY']!);
	console.log(res);
	console.log('done ' + id);
}));
console.log('done');
})();
