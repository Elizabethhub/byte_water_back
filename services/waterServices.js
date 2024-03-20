import Water from "../models/Water.js";

export const addWater = (data) => Water.create(data);

export const getAllWater = (filter) => Water.find({ userId: filter });

export const editWater = (id, body) =>
  Water.findByIdAndUpdate(id, body, { new: true, runValidators: true });

export const deleteWater = (id) => Water.findByIdAndDelete(id);
