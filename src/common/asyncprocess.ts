import * as cproc from "child_process";
import { WriteStream } from "fs";
import { JobProcessingError } from "../common/models/error";
import * as treekill from "tree-kill";
const BufferList = require("bl")

export let spawn = (command: string, args: string[], cancellationCheckFn?: () => Promise<boolean>, stdoutStream?: WriteStream, stderrStream?: WriteStream) => {
  const child = cproc.spawn(command, args, {detached: false});
  console.log("Spawned pid " + child.pid);
  const bl: string[] = [];

  if (child.stdout) {
    if(stdoutStream) {
      child.stdout.pipe(stdoutStream);
    }
    if(stderrStream) {
      child.stderr.pipe(stderrStream);
    }
    child.stdout.on("data", data => {
      bl.push(data.toString());
      console.log(data.toString().replace(/\n$/, ""));
    });
    child.stderr.on("data", data => {
      bl.push(data.toString());
      console.error(data.toString().replace(/\n$/, ""));
    });
  }

  const promise = new Promise<any>((resolve, reject) => {
    
    let intervalRun = null;
    if(cancellationCheckFn) {
      intervalRun = setInterval( () => {
        cancellationCheckFn().then(value => {
          if(!value) {
            console.log("Cancellation requested, killing the process, id " + child.pid);
            
            // process.kill(child.pid, "SIGKILL");
            treekill(child.pid, "SIGKILL");
            if(intervalRun) {
              clearInterval(intervalRun);
            }
          }
        }).catch();
      }, 1000);
    }

    child.on("error", (reason) => {
      if(intervalRun) {
        clearInterval(intervalRun);
      }
      console.error("Child process error: ", reason);
      reject(new JobProcessingError(reason.message, bl));
    });

    child.on("exit", (code) => {
      if(intervalRun) {
        clearInterval(intervalRun);
      }
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