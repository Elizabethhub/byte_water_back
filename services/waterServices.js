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

  const numDays = (y, m) => new Date(y, m, 0).getDate();
  const daysInMonth = numDays(year, month);
  console.log('daysInMonth: ', daysInMonth);

  let list = [];
  for (let index = 1; index <= daysInMonth; index++) {
    list.push({
      day: index,
      month,
      ...waterStatisticsList.reduce((acc, item) => {
        if (dateFormat.formatDateDay(item.date) == index) {
          acc = {
            date: dateFormat.formatDate(item.date),
            waterPortions: item.waterVolumes.length,
            waterVolPercentage: item.waterVolPercentage,
            dailyNorma: dailyNormQuantity,
          };
        }

        return acc;
      }, {}),
    });
  }

  console.log(list);

  return list;
}

export async function getWaterConsumptionDaySummary(owner, time) {
  const user = await findUserById(owner);
  if (!user) throw HttpError(404, 'User not found');
  const dailyNormAmount = user.dailyNorma;

  let waterConsumptionArray = await Water.aggregate([
    {
      $match: {
        $and: [
          { userId: owner },
          {
            time: {
              $gte: new Date(time),
              $lt: new Date(new Date(time).getTime() + 24 * 60 * 60 * 1000),
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: null,
        waterVolumeSum: { $sum: '$milliliters' },
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
      $project: {
        _id: 0,
      },
    },
  ]);
  if (waterConsumptionArray.length === 0) {
    waterConsumptionArray = [
      {
        waterVolumeSum: 0,
        waterVolumes: [],
        waterVolumePercentage: 0,
      },
    ];
  }

  return waterConsumptionArray;
}
