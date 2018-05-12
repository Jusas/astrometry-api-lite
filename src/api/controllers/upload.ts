import * as fs from "fs";
import * as path from "path";
import * as express from "express";
import { configuration } from "../../common/configuration";
import { Get, Post, Route, Body, Tags, Request } from "tsoa";
import { UploadRequest, UploadResponse, UploadRequestWrapper, UploadProcessingStatus } from "../models/upload";
import * as Jobs from "../services/jobs";
import { JobFileInfo } from "../../common/models/job";

@Route("api/upload")
export class UploadController {

  @Post()
  async postUpload(@Body() model: UploadRequestWrapper, @Request() req: express.Request): Promise<UploadResponse> {

    if (!req.file || !req.file.filename) {
      throw new Error("no file upload present");
    }

    const uploadDir = configuration().queueFileUploadDir;
    const filenameWithExtension = req.file.filename + path.extname(req.file.originalname);
    fs.renameSync(`${uploadDir}/${req.file.filename}`, `${uploadDir}/${filenameWithExtension}`);

    const fileInfo: JobFileInfo = {
      filename: filenameWithExtension,
      original_filename: req.file.originalname
    };

    const queued = await Jobs.queue(fileInfo, model["request-json"]);
    const result: UploadResponse = {
      hash: queued.hash,
      status: UploadProcessingStatus.success,
      subid: queued.id
    };

    console.log(req.file.filename);
    return result;

  }

}
