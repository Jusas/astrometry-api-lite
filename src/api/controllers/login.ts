import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import { LoginRequest, LoginResponse, LoginRequestWrapper } from "../models/login";

@Route("api/login")
export class LoginController {

  @Post()
  async postLogin (@Body() req: LoginRequestWrapper): Promise<LoginResponse> {
    const res: LoginResponse = {
			status: "success",
			message: "authentication not implemented, request ignored",
			session: "no-session"
		};
    return res;
  }

}
