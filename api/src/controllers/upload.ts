import * as express from "express";
import { Get, Post, Route, Body, Tags, Request } from "tsoa";
import { UploadRequest, UploadResponse, UploadRequestWrapper, UploadProcessingStatus } from "../models/upload";
import * as Jobs from "../services/jobs";
import { JobFileInfo } from "../models/job";

@Route("api/upload")
export class UploadController {

  @Post()
  async post (@Body() model: UploadRequestWrapper, @Request() req: express.Request): Promise<UploadResponse> {		
				
		if(!req.file || !req.file.filename) {
			throw new Error("no file upload present");
		}


		const fileInfo: JobFileInfo = {
			filename: req.file.filename,
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
