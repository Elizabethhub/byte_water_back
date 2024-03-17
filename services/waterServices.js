import Water from "../models/Water.js";

export const addWater = async (data) => {
  return Water.create(data);
};
