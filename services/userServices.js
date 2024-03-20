import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const findUser = (filter) => User.findOne(filter);

export const findUserById = (id) => User.findById(id);

export const updateUser = async (filter, data) => {
  const { newPassword: password } = data;
  if (!password) {
    return;
  }
  console.log(password);
  const hashPassword = await bcrypt.hash(password, 10); // const salt = await bcrypt.genSalt(10);
  return User.findOneAndUpdate(
    filter,
    { ...data, password: hashPassword },
    { new: true }
  );
};
