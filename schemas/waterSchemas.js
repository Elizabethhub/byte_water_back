import Joi from 'joi';

export const addWaterSchema = Joi.object({
  milliliters: Joi.number().required(),
  time: Joi.date().required(),
});
export const editWaterSchema = Joi.object({
  milliliters: Joi.number(),
  time: Joi.date(),
});

export const validateDate = Joi.object({
  year: Joi.number().integer().min(2000).max(2100).required(),
  month: Joi.number().integer().min(1).max(12).required(),
});

// for swagger
// "requestBody": {
//   "required": true,
//   "content": {
//     "application/json": {
//       "schema": {
//         "$ref": "#/components/schemas/WaterMonthReq"
//       }
//     }
//   }
// },
