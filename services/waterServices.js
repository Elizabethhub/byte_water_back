import HttpError from '../helpers/HttpError.js';
import Water from '../models/Water.js';
import { findUserById } from './userServices.js';

export const addWater = (data) => Water.create(data);

export const getAllWater = (filter) => Water.find({ userId: filter });

export const editWater = (id, body) =>
  Water.findByIdAndUpdate(id, body, { new: true, runValidators: true });

export const deleteWater = (id) => Water.findByIdAndDelete(id);

export async function getWaterConsumptionMonthSummary(owner, year, month) {
  const user = await findUserById(owner);
  if (!user) throw HttpError(404, 'User not found');

  const dailyNormAmount = user.dailyNorma;
  const firstDayOfMonth = new Date(year, month - 1, 1);
  const lastDayOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const waterConsumptionArray = await Water.aggregate([
    {
      $match: {
        owner: owner,
        date: { $gte: firstDayOfMonth, $lt: lastDayOfMonth },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        waterVolumeSum: { $sum: '$waterAmount' },
        waterVolumes: { $push: '$$ROOT' },
      },
    },
    {
      $addFields: {
        waterVolumePercentage: {
          $round: {
            $multiply: [{ $divide: ['$waterVolumeSum', dailyNormAmount] }, 100],
          },
        },
      },
    },
    {
      $sort: { _id: 1 },
    },
    {
      $project: {
        _id: 0,
        date: '$_id',
        waterVolumeSum: 1,
        waterVolumePercentage: 1,
        waterVolumes: 1,
      },
    },
  ]);

  const waterObjectresult = waterConsumptionArray.reduce((acc, item) => {
    const portions = item.waterVolumes.length;
    acc[item.date] = {
      date: dateFormat.formatDate(item.date),
      portions: portions,
      waterVolumePercentage: item.waterVolumePercentage,
      dailyNorma: dailyNormAmount,
    };

    return acc;
  }, {});
  console.log('acc', acc);
  return waterObjectresult;
}
