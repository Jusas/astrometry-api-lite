import * as express from "express";
import { Get, Post, Route, Body, Tags, Request } from "tsoa";
import { UploadRequest, UploadResponse, UrlUploadRequestWrapper, UploadProcessingStatus } from "../models/upload";
import * as Jobs from "../services/jobs";
import { JobFileInfo } from "../models/job";
import * as urlValidation from "valid-url";

@Route("api/url_upload")
export class UrlUploadController {

  @Post()
  async post (@Body() model: UrlUploadRequestWrapper): Promise<UploadResponse> {		
				
		const u = model["request-json"].url;
		if(!urlValidation.isHttpsUri(u) && !urlValidation.isHttpUri(u)) {
			throw new Error("url must be a valid http or https url");
		}

		const fileInfo: JobFileInfo = {
			url: u
		};

		const queued = await Jobs.queue(fileInfo, model["request-json"]);
		const result: UploadResponse = {
			hash: queued.hash,
			status: UploadProcessingStatus.success,
			subid: queued.id
		};

		return result;
    
  }

}

export let uploadContentWrangler = (req: express.Request, res: express.Response, next: express.NextFunction) => {
	if(typeof req.body["request-json"] === "string") {
		req.body["request-json"] = JSON.parse(req.body["request-json"]);		
	}
	next();
};