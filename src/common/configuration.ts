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
