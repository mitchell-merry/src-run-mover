import * as SRC from "src-ts"
import * as data from "./data.json"

(async () => {

const { variables, ...filter } = data.from;
console.log(filter, variables)
let runs = await SRC.getAllRuns({ ...filter, status: 'verified'});

if(SRC.isError(runs)) throw new Error(runs.message);

runs = SRC.filterRuns(runs, variables);

console.log(`Found ${runs.length} runs in leaderboard...`);

})();
