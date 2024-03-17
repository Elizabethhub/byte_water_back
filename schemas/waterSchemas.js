import Joi from "joi";

export const addWaterSchema = Joi.object({
  milliliters: Joi.number().required(),
  time: Joi.date(),
});
