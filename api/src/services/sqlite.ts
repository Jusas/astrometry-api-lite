import * as SystemSettings from "../settings";
import * as sqlite from "sqlite";

export let openDatabase = async () => {
	let dbFile = `${SystemSettings.rootDir()}/../database/workdb.db`;
	var db = await sqlite.open(dbFile);
}