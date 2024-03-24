import ctrlWrapper from '../decorators/ctrlWrapper.js';
import HttpError from '../helpers/HttpError.js';

import * as waterServices from '../services/waterServices.js';

const addWater = async (req, res) => {
  const { _id: userId } = req.user;
  const { milliliters } = req.body;

  if (milliliters >= 5000) {
    throw HttpError(400, 'Milliliters must be less than 5000');
  }

  const result = await waterServices.addWater({ ...req.body, userId });
  res.status(201).json(result);
};
const getAllWater = async (req, res) => {
  const { _id: owner } = req.user;

  const result = await waterServices.getAllWater(owner);

  res.json(result);
};
const editWater = async (req, res) => {
  const { id } = req.params;

  const result = await waterServices.editWater(id, req.body);

  if (!result) {
    throw HttpError(404, `Water with id ${id} not found`);
  }

  res.json(result);
};
const deleteWater = async (req, res) => {
  const { id } = req.params;

  const result = await waterServices.deleteWater(id);

  if (!result) {
    throw HttpError(404, `Water with id ${id} not found`);
  }

  res.json(result);
};

export async function monthInfoWater(req, res) {
  const { _id: owner } = req.user;
  const { year, month } = req.query;
  console.log('month: ', month);
  console.log('year: ', year);

  const monthlyWaterConsumption = await waterServices.getMonthlyWaterStatistics(
    owner,
    year,
    month
  );
  res.status(200).json(monthlyWaterConsumption);
}

export async function getTodayWaterNote(req, res) {
  const { _id: owner } = req.user;
  const { date } = req.query;
  console.log('date', date);
  const waterConsumptionArray =
    await waterServices.getWaterConsumptionDaySummary(owner, date);
  res.status(200).json(waterConsumptionArray[0]);
}

export default {
  addWater: ctrlWrapper(addWater),
  editWater: ctrlWrapper(editWater),
  getAllWater: ctrlWrapper(getAllWater),
  deleteWater: ctrlWrapper(deleteWater),
  monthInfoWater: ctrlWrapper(monthInfoWater),
  getTodayWaterNote: ctrlWrapper(getTodayWaterNote),
};
