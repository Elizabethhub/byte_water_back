import ctrlWrapper from "../decorators/ctrlWrapper.js";

import * as waterServices from "../services/waterServices.js";

const addWater = async (req, res) => {
  const result = await waterServices.addWater(req.body);
  res.status(201).json(result);
};

export default {
  addWater: ctrlWrapper(addWater),
};
