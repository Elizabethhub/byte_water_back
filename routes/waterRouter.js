import express from "express";
import validateBody from "../decorators/validateBody.js";
import { addWaterSchema } from "../schemas/waterSchemas.js";
import waterController from "../controllers/waterController.js";

const waterRouter = express.Router();

waterRouter.post("/addwater", validateBody(addWaterSchema), waterController.addWater);

// contactsRouter.post(
//     "/",
//     upload.single("photo"),

//     contactsController.createContact
//   );

// mountInfo: [];

// today{
// percent
// }

export default waterRouter;
