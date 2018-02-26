import * as fs from "fs";

namespace Config {

	let configurations: { [key: string]: any } = {
	};

	export function load(file: string, configName: string) {
		let buf = fs.readFileSync(file, {encoding: "utf-8", flag: "r"});
		let conf = JSON.parse(buf);
		configurations[configName] = conf;
		
	}

	export function get(configName: string): any {
		if(configurations.hasOwnProperty(configName))
			return configurations[configName];
		return undefined;
	}

	

	export function setTransient(key: string, value: any) {
		configurations[key] = value;
	}

	export function parseAsPath(value: any): string {
		if(typeof value !== "string") {
			return value;
		}
		let s = (<string>value);
		if(s[0] !== "/" && s.substr(0, 2) !== "./") {
			s = `${__dirname}/${s}`;
		}
		return s;
	}

}

export = Config;