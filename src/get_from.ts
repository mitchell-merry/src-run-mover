import 'dotenv/config';
import * as SRC from "src-ts";
import * as data from "./data.json";
import fs from 'fs';

(async () => {

const { variables, ...filter } = data.from;
console.log(filter, variables)
let runs = await SRC.getAllRuns({ ...filter, status: 'verified'});

if(SRC.isError(runs)) throw new Error(runs.message);

runs = SRC.filterRuns(runs, variables);

console.log(`Found ${runs.length} runs in leaderboard...`);

const ids = runs.map(run => run.id);

fs.mkdirSync('./DATA', { recursive: true });
fs.writeFileSync('./DATA/from_ids.json', JSON.stringify(ids, null, 2));

console.log('Verify found runs in DATA/from_ids.json before sending to leaderboard.');
})();
