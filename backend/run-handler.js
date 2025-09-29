import handlerModule, { app as expressApp } from "./api/index.js";
import express from "express";

// If the api module exports the raw express app, use it directly.
// Otherwise fallback to the serverless handler.
const port = process.env.PORT || 4001;

if (expressApp && typeof expressApp.listen === "function") {
  expressApp.listen(port, () =>
    console.log(`Express app listening on http://localhost:${port}`)
  );
} else if (handlerModule && typeof handlerModule === "function") {
  // serverless handler fallback: wrap it into an express app
  const wrapper = express();
  wrapper.use((req, res) => handlerModule(req, res));
  wrapper.listen(port, () =>
    console.log(
      `Serverless handler wrapper listening on http://localhost:${port}`
    )
  );
} else {
  console.error("No valid handler or app exported from ./api/index.js");
  process.exit(1);
}
