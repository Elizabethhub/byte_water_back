import Joi from "joi";

export const addWaterSchema = Joi.object({
  milliliters: Joi.number().required(),
  time: Joi.date().required(),
});
export const editWaterSchema = Joi.object({
  milliliters: Joi.number(),
  time: Joi.date(),
});
