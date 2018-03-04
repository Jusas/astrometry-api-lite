import * as args from "command-line-args";
import * as mgr from "./manager";
import { RunningProcess } from "../common/models/runningProcess";
import { configuration } from "../common/configuration";


let activeWorkers: RunningProcess[] = [];

async function run() {

    const config = configuration();
    const maxWorkerCount = config.maxConcurrentWorkers;
    console.log("Manager started");

    setInterval( async () => {
        let queueCount = await mgr.getQueuedItemCount().catch( (err) => { throw err } );
        //console.log("QUEUE COUNT " + queueCount);
        if(activeWorkers.length < maxWorkerCount && queueCount > 0) {
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
    }, 200);

    setInterval(() => console.log(`Worker manager is still alive, active/max worker count: ${activeWorkers.length}/${maxWorkerCount}`), 
        300000);
    
}

run();