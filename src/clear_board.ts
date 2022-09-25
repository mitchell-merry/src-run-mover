import 'dotenv/config';
import * as SRC from "src-ts";
import * as data from "./data.json";
import promptSync from 'prompt-sync';
import { exit } from 'process';
import { PutRunStatus } from 'src-ts';
const prompt = promptSync();

console.log(process.env['API-KEY'])
if(!process.env['API-KEY']) exit(1);

(async () => {

const { variables, ...filter } = data.clear;
console.log(filter, variables)
let runs = await SRC.getAllRuns({ ...filter, status: 'verified'});

if(SRC.isError(runs)) throw new Error(runs.message);

runs = SRC.filterRuns(runs, variables);

console.log(`Found ${runs.length} runs in leaderboard...`);

const ids = runs.map(run => run.id);
console.log(ids);

console.log('Verify that these runs are correct before continuing!!');
console.log('I fully understand that what I am about to do is destructive and irreversible.')
const resp = prompt("I am sure that this is the action I want to take, and all blame if something goes wrong is on me. [Y/n] ");
if(resp !== 'Y')
{
	console.log(`Aborting... (Response: ${resp})`);
	return;
}

const status: PutRunStatus['status'] = {
	status: "rejected",
	reason: "Your run has automatically moved to another category. Contact me if you have questions."
}

// destruction!!!!
await Promise.all(ids.map(async id => {

	const res = await SRC.setRunStatus(id, status, process.env['API-KEY'] ?? '');
	if(SRC.isError(res) && res.status !== 500) throw new Error(JSON.stringify(res, null, 2));
	console.log("Finished deleting " + id);
}));

console.log("done all.");

})();
