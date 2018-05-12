import * as fs from "fs";
import * as path from "path";

export interface ConfigValues {
  [key: string]: any,
  setTransientValue: (key: string, value: any) => void
}

let config: ConfigValues = null;

export const configuration = (): ConfigValues => {
  if (!config) {
    const configPath = path.dirname(require.main.filename);
    let configFile = "configuration.json";
    if (process.env.AAPI_LITE_ENV) {
      configFile = `configuration.${process.env.AAPI_LITE_ENV}.json`;
    }
    config = JSON.parse(fs.readFileSync(path.join(configPath, configFile), "utf-8"));
    config.setTransientValue = (key, value) => {
      config[key] = value;
    };
  }
  return config;
}

// namespace Config {

// 	let configurations: { [key: string]: any } = {
// 	};

// 	export function load(file: string, configName: string) {
// 		let buf = fs.readFileSync(file, {encoding: "utf-8", flag: "r"});
// 		let conf = JSON.parse(buf);
// 		configurations[configName] = conf;

// 	}

// 	export function get(configName: string): any {
// 		if(configurations.hasOwnProperty(configName))
// 			return configurations[configName];
// 		return undefined;
// 	}



// 	export function setTransient(key: string, value: any) {
// 		configurations[key] = value;
// 	}

// 	export function parseAsPath(value: any): string {
// 		if(typeof value !== "string") {
// 			return value;
// 		}
// 		let s = (<string>value);
// 		if(s[0] !== "/" && s.substr(0, 2) !== "./") {
// 			s = `${__dirname}/${s}`;
// 		}
// 		return s;
// 	}

// }

// export = Config;