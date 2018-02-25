import { Request, Response, NextFunction } from "express";
import { Get, Post, Route, Body, Tags } from "tsoa";
import { LoginRequest, LoginResponse, LoginRequestWrapper } from "../models/login";

@Route("api/login")
export class LoginController {

  @Post()
  async post (@Body() req: any): Promise<LoginResponse> {
    const res: LoginResponse = {
			status: "success",
			message: "authentication not implemented, request ignored",
			session: "no-session"
		};
    return res;
  }

}
