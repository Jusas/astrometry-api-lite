import { EditableConfig } from "../models/config";
import * as path from "path";
import * as fs from "fs";

export async function setEditableConfig(config: EditableConfig): Promise<EditableConfig> {

  // Editing the worker config file.
  // Should be found from <process>/../worker/configuration.json

  const runPath = path.dirname(require.main.filename);
  const workerConfPath = path.resolve(runPath, "..", "worker", "configuration.json");

  if(!fs.existsSync(runPath)) {
    throw new Error("Unable to set config: the file path " + workerConfPath + " does not exist");
  }

  let configContent = JSON.parse(fs.readFileSync(workerConfPath, "utf-8"));
  configContent["depth"] = config.depth;
  configContent["sigma"] = config.sigma;
  configContent["storeObjsImages"] = config.saveObjImages;
  configContent["storeNgcImages"] = config.saveNgcImages;
  configContent["imageScale"] = config.imageScale;

  fs.writeFileSync(workerConfPath, JSON.stringify(configContent, null, "  "))

  return config;
}

export async function getEditableConfig(): Promise<EditableConfig> {
  const runPath = path.dirname(require.main.filename);
  const workerConfPath = path.resolve(runPath, "..", "worker", "configuration.json");

  if(!fs.existsSync(runPath)) {
    throw new Error("Unable to set config: the file path " + workerConfPath + " does not exist");
  }

  let configContent = JSON.parse(fs.readFileSync(workerConfPath, "utf-8"));
  return {
    depth: configContent["depth"] || 0,
    sigma: configContent["sigma"] || 0,
    imageScale: configContent["imageScale"] || 1,
    saveNgcImages: configContent["storeNgcImages"],
    saveObjImages: configContent["storeObjsImages"]
  }
}
