import express from "express";
import validateBody from "../decorators/validateBody.js";
import { addWaterSchema, editWaterSchema } from "../schemas/waterSchemas.js";
import waterController from "../controllers/waterController.js";
import authenticate from "../middlewares/authenticate.js";
import isValidId from "../middlewares/isValidId.js";

const waterRouter = express.Router();

waterRouter.use(authenticate);

waterRouter.post(
  "/addwater",
  validateBody(addWaterSchema),
  waterController.addWater
);
waterRouter.get("/", waterController.getAllWater);

waterRouter.put(
  "/:id",
  validateBody(editWaterSchema),
  isValidId,
  waterController.editWater
);
waterRouter.delete("/:id", isValidId, waterController.deleteWater);

export default waterRouter;
