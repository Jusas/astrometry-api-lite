import * as express from "express";
import * as morgan from "morgan";
import * as multer from "multer";
import * as bodyParser from "body-parser";
import { configuration, ConfigValues } from "../common/configuration";
import * as loginController from "./controllers/login";
import * as uploadController from "./controllers/upload";
import * as uploadUrlController from "./controllers/url-upload";
import * as submissionsController from "./controllers/submissions";
import * as jobsController from "./controllers/jobs";
import * as statsController from "./controllers/stats";
import * as resultImagesController from "./controllers/result-images";
import * as jobcontrolController from "./controllers/jobcontrol";
import { RegisterRoutes } from "./generated/routes/routes";
import { NextFunction } from "express-serve-static-core";
import { asyncErrorHandler } from "./middleware/error-handler";
import { jsonContentWrangler } from "./middleware/request-json-wrangler";
import { ApiError } from "./models/error";

const app = express();

const config = configuration();

app.set("port", config.apiPort);
app.use(morgan(":method :url :status :response-time ms"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());
if (config.enableSwagger) {
  app.use("/swagger", express.static(__dirname + "/swagger-ui"));
  app.use("/swagger.json", (req: express.Request, res: express.Response) => {
    res.sendFile(__dirname + "/swagger.json");
  });
}
if (config.enableDashboard) {
  app.use("/dashboard", express.static(__dirname + "/dashboard"));
}

const upload = multer({ dest: config.queueFileUploadDir });
app.post("/api/upload", upload.single("file"), jsonContentWrangler);
app.post("/api/login", jsonContentWrangler);
app.post("/api/url_upload", jsonContentWrangler);

if (!config.enableJobCancellationApi) {
  app.use(/\/api\/job-control/, (req: express.Request, res: express.Response) => {
    res.status(403);
    res.json({ status: "unauthorized" });
  });
}

RegisterRoutes(app);


app.use((err: any, req: express.Request, res: express.Response, next: NextFunction) => {
  if (err instanceof ApiError) {
    res.status((<ApiError>err).statusCode);
  }
  else {
    res.status(500);
  }
  console.log(err);
  res.json({
    message: err.message
  });
});

const server = app.listen(app.get("port"), () => {
  console.log("Running, port " + app.get("port"));
});

export = server;