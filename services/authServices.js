import bcrypt from "bcrypt";
import User from "../models/User.js";

export const signup = async (data) => {
  const { password } = data;
  const hashPassword = await bcrypt.hash(password, 10); // const salt = await bcrypt.genSalt(10);
  return User.create({ ...data, password: hashPassword });
};

export const setToken = (id, token = "") => User.findByIdAndUpdate(id, { token });

export const setSubscription = (id, subscription) => User.findByIdAndUpdate(id, { subscription }, { new: true });

export const setAvatar = (id, avatarURL) => User.findByIdAndUpdate(id, { avatarURL }, { new: true });
