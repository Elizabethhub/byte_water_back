import HttpError from '../helpers/HttpError.js';
import Water from '../models/Water.js';
import { findUserById } from './userServices.js';
import dateFormat from '../helpers/formatDate.js';

export const addWater = (data) => Water.create(data);

export const getAllWater = (filter) => Water.find({ userId: filter });

export const editWater = (id, body) =>
  Water.findByIdAndUpdate(id, body, { new: true, runValidators: true });

export const deleteWater = (id) => Water.findByIdAndDelete(id);

export async function getMonthlyWaterStatistics(owner, year, month) {
  const user = await findUserById(owner);
  if (!user) throw HttpError(404, 'User not found');

  const dailyNormQuantity = user.dailyNorma;
  const firstDayOfCurrentMonth = new Date(year, month - 1, 1);
  const lastDayOfCurrentMonth = new Date(year, month, 0, 23, 59, 59, 999);

  const waterStatisticsList = await Water.aggregate([
    {
      $match: {
        userId: owner,
        time: { $gte: firstDayOfCurrentMonth, $lt: lastDayOfCurrentMonth },
      },
    },
    {
      $group: {
        _id: { $dateToString: { format: '%Y-%m-%d', date: '$time' } },
        waterSum: { $sum: '$milliliters' },
        waterVolumes: { $push: '$$ROOT' },
      },
    },
    {
      $addFields: {
        waterVolPercentage: {
          $round: {
            $multiply: [{ $divide: ['$waterSum', dailyNormQuantity] }, 100],
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
        waterSum: 1,
        waterVolPercentage: 1,
        waterVolumes: 1,
      },
    },
  ]);

  const waterObjectresult = waterStatisticsList.reduce((acc, item) => {
    const waterPortions = item.waterVolumes.length;
    acc[item.date] = {
      date: dateFormat.formatDate(item.date),
      waterPortions: waterPortions,
      waterVolPercentage: item.waterVolumePercentage,
      dailyNorma: dailyNormQuantity,
    };
    return acc;
  }, {});
  return waterObjectresult;
}
