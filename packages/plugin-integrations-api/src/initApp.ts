import * as bodyParser from "body-parser";

import initCallPro from "./callpro/controller";
import { debugIntegrations, debugRequest } from "./debuggers";
import systemStatus from "./systemStatus";
import userMiddleware from "./userMiddleware";
import app from "@erxes/api-utils/src/app";

const rawBodySaver = (req, _res, buf, encoding) => {
  if (buf?.length) {
    req.rawBody = buf.toString(encoding || "utf8");

    if (req.headers.fromcore === "true") {
      req.rawBody = req.rawBody.replace(/\//g, "\\/");
    }
  }
};

const initApp = async () => {
  app.use(
    bodyParser.urlencoded({
      limit: "10mb",
      verify: rawBodySaver,
      extended: true,
    })
  );

  app.use(bodyParser.json({ limit: "10mb", verify: rawBodySaver }));

  app.use(userMiddleware);

  app.use(bodyParser.raw({ limit: "10mb", verify: rawBodySaver, type: "*/*" }));

  app.use((req, _res, next) => {
    debugRequest(debugIntegrations, req);

    next();
  });

  app.get("/system-status", async (_req, res) => {
    return res.json(await systemStatus());
  });

  // init callpro
  initCallPro(app);

  // Error handling middleware
  app.use((error, _req, res, _next) => {
    console.error(error.stack);
    res.status(500).send(error.message);
  });
};

export default initApp;
