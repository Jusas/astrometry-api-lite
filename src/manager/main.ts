import * as args from "command-line-args";
import * as mgr from "./manager";
import { RunningProcess } from "../common/models/runningProcess";
import { configuration } from "../common/configuration";


let activeWorkers: RunningProcess[] = [];

async function run() {

  const config = configuration();
  const maxWorkerCount = config.maxConcurrentWorkers;
  console.log("Manager started");

  setInterval(
    () => console.log(`Worker manager is still alive, active/max worker count: ${activeWorkers.length}/${maxWorkerCount}`),
    300000);

  await handleQueuedWork(maxWorkerCount);

}

async function handleQueuedWork(maxWorkerCount: number) {

  let queueCount = await mgr.getQueuedItemCount().catch(
    (err) => console.log("Error getting queued item count: ", err)
  );

  if (activeWorkers.length < maxWorkerCount && queueCount > 0) {
    let instance = null;
    try {
      instance = mgr.spawnWorkerInstance();
    }
    catch (err) {
      console.log("Error, failed to spawn a worker instance: ", err);
    }

    if (instance != null) {
      activeWorkers.push(instance);
      console.log(`Active worker count: ${activeWorkers.length}/${maxWorkerCount}`);
      let promiseHandler = () => {
        let itemIndex = activeWorkers.findIndex((value, index) => value.id == instance.id);
        if (itemIndex != -1) {
          activeWorkers.splice(itemIndex, 1);
          console.log(`Active worker count: ${activeWorkers.length}/${maxWorkerCount}`);
        }
      };
      instance.promise
        .then(promiseHandler, promiseHandler)
        .catch(promiseHandler);

      const shortWait = new Promise<any>((res, rej) => {
        setTimeout(res, 500);
      });
      await shortWait;
    }
  }
  setTimeout(handleQueuedWork, 500, maxWorkerCount);
}


run();