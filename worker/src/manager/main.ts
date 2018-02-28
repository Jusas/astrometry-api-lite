import * as args from "command-line-args";
import * as mgr from "./manager";
import * as config from "../configuration";
import { RunningProcess } from "../common/models/runningProcess";

// run the queue query in loop, and maintain process pool.
// If we have less then max processes running and getRecommendedWorkerCount has higher count than what's running, start a process.

let activeWorkers: RunningProcess[] = [];

const argsDefinition = [
	{
		name: "config-file",
		alias: "c",
		type: String
	}
];

const opts = args(argsDefinition);
let pollTimer = null;
let statusTimer = null;

async function run() {

    config.load(opts["config-file"], "manager");
    let maxWorkerCount = config.get("manager").maxConcurrentWorkers;
    console.log("Manager started");

    setInterval( async () => {
        let wc = await mgr.getRecommendedWorkerCount().catch( (err) => { throw err } );
        if(activeWorkers.length < wc) {
            let instance = mgr.spawnWorkerInstance();
            activeWorkers.push(instance);
            console.log(`Active worker count: ${activeWorkers.length}/${maxWorkerCount}`);
            let promiseHandler = () => {
                let itemIndex = activeWorkers.findIndex((value, index) => value.id == instance.id);
                if(itemIndex != -1) {
                    activeWorkers.splice(itemIndex, 1);
                    console.log(`Active worker count: ${activeWorkers.length}/${maxWorkerCount}`);
                }
            };
            instance.promise
                .then(promiseHandler, promiseHandler)
                .catch(promiseHandler);            
        }        
    }, 300);

    setInterval(() => console.log("Worker manager is still alive, worker count: " + activeWorkers.length), 
        60000);
    
}

run();