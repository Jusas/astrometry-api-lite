import * as cproc from "child_process";
import { WriteStream } from "fs";
import { JobProcessingError } from "../common/models/error";
const BufferList = require("bl")

export let spawn = (command: string, args: string[], stdoutStream?: WriteStream, stderrStream?: WriteStream) => {
  const child = cproc.spawn(command, args);
  const bl: string[] = [];

  if (child.stdout) {
    if(stdoutStream) {
      child.stdout.pipe(stdoutStream);
    }
    if(stderrStream) {
      child.stderr.pipe(stderrStream);
    }
    child.stdout.on("data", data => {
      bl.push(data.toString())
      console.log(data.toString());
    });
    child.stderr.on("data", data => {
      bl.push(data.toString());
      console.error(data.toString());
    });
  }

  const promise = new Promise<any>((resolve, reject) => {
    
    child.on("error", (reason) => {
      console.error("Child process error: ", reason);
      reject(new JobProcessingError(reason.message, bl));
    });

    child.on("exit", (code) => {
      if (code === 0) {
        resolve(bl);
      } else {
        console.error(`Child process exited with code ${code}`);
        reject(new JobProcessingError(`child exited with code ${code}`, bl));
      }
    });
  });


  return promise;
}