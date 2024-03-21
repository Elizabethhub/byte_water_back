import User from '../models/User.js';
import bcrypt from 'bcrypt';

export const findUser = (filter) => User.findOne(filter);

export const findUserById = (id) => User.findById(id);

export const updateUser = async (filter, data) => {
  if (data.newPassword) {
    const { newPassword: password } = data;
    console.log(password);
    const hashPassword = await bcrypt.hash(password, 10); // const salt = await bcrypt.genSalt(10);
    return User.findOneAndUpdate(
      filter,
      { ...data, password: hashPassword },
      { new: true }
    );
  } else {
    return User.findOneAndUpdate(filter, data, { new: true });
  }
};
// 2b$10$3T7MVJI2VzCcMFzYZIDp2uhPJYLnfkV5cn9I0OqQNb7uzNFNTH9W.
