import { Request, Response, NextFunction } from "express";

export let jsonContentWrangler = (req: Request, res: Response, next: NextFunction) => {
  if (typeof req.body["request-json"] === "string") {
    req.body["request-json"] = JSON.parse(req.body["request-json"]);
  }
  next();
};