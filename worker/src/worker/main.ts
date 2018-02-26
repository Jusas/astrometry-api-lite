import * as args from "command-line-args";
import * as worker from "./worker";
import * as cfg from "../configuration";

const argsDefinition = [
	{
		name: "config-file",
		alias: "c",
		type: String
	},
	{
		name: "worker-id",
		alias: "i",
		type: String,
		defaultValue: "defaultworker"
	}
];

const opts = args(argsDefinition);
// TODO hash check on file, do not re-run on identical hash, just return the data.
async function run() {
	cfg.load(opts["config-file"], "worker");
	cfg.setTransient("worker-id", opts["worker-id"])
	await worker.processQueueItem();
	console.log("Worker exiting");
}

run();
