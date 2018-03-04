import * as assert from "assert";
import { LoginController } from "./login";
import { LoginRequestWrapper } from "../models/login";

describe("post", async () => {
    it("should return success", async () => {
        const req: LoginRequestWrapper = {
            "request-json": {
                apikey: "somekey"
            }
        };
        const res = await LoginController.prototype.postLogin(req);
        assert.equal(res.status, "success");
    });
});