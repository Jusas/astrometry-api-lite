import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import * as datetime from "node-datetime";
import { ApiError } from "../models/error";
import { EditableConfig } from "../models/config";
import * as ConfigService from "../services/configedit";


@Route("api/config")
export class ConfigEditController {

  @Post()
  async setConfig(@Body() conf: EditableConfig): Promise<EditableConfig> {
    return await ConfigService.setEditableConfig(conf);
  }

  @Get()
  async getConfig(): Promise<EditableConfig> {
    return await ConfigService.getEditableConfig();
  }

}