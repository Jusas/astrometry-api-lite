import * as args from "command-line-args";
import * as worker from "./worker";
import { configuration } from "../common/configuration";

const argsDefinition = [
	{
		name: "worker-id",
		alias: "i",
		type: String,
		defaultValue: "defaultworker"
	}
];

const opts = args(argsDefinition);

async function run() {
	const config = configuration();
	
	config.setTransientValue("worker-id", opts["worker-id"])
	await worker.processQueueItem();
	console.log("Worker exiting");
}

run();
