import * as mgr from "./manager";

// run the queue query in loop, and maintain process pool.
// If we have less then max processes running and getRecommendedWorkerCount has higher count than what's running, start a process.
