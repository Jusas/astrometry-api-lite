import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import { ApiError } from "../models/error";
import * as Jobs from "../services/jobs";
import { ResultImageType } from "../../common/models/job";

@Route("api/result-images")
export class ResultImageController {

  @Get("annotation/{id}")
  async getAnnotationImage (id: number): Promise<string> {
		const data = await Jobs.getResultImage(id, ResultImageType.NgcImage);
		if(!data) {
			throw new ApiError("image not found", 404);
		}

		return data;
	}

	@Get("objects/{id}")
  async getObjectImage (id: number): Promise<string> {
		const data = await Jobs.getResultImage(id, ResultImageType.ObjectsImage);
		if(!data) {
			throw new ApiError("image not found", 404);
		}

		return data;
	}
}
