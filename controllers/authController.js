import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import fs from "fs/promises";
import path from "path";
import { nanoid } from "nanoid";

import gravatar from "gravatar";
import Jimp from "jimp";

import * as authServices from "../services/authServices.js";
import * as userServices from "../services/userServices.js";

import ctrlWrapper from "../decorators/ctrlWrapper.js";

import HttpError from "../helpers/HttpError.js";
// import sendEmail from "../helpers/sendEmail.js";

const avatarsDir = path.resolve("public", "avatars");

const { JWT_SECRET, BASE_URL } = process.env;

const signup = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (user) {
    throw HttpError(409, "email already used");
  }
  // const verificationCode = nanoid();
  const avatarURL = gravatar.url(email);
  // const newUser = await authServices.signup({ ...req.body, avatarURL, verificationCode });
  const newUser = await authServices.signup({
    ...req.body,
    avatarURL,
    username: `User${Date.now()}`,
  });

  res.status(201).json({
    username: newUser.username,
    email: newUser.email,
    avatarURL: avatarURL,
  });
};

const verify = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await userServices.findUser({ verificationCode });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  await userServices.updateUser(
    { _id: user.id },
    { verify: true, verificationCode: "" }
  );
  res.json({
    message: "Verification successful",
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(404, "User not found");
  }
  if (user.verify) {
    throw HttpError(400, "User already verified");
  }
  const verifyEmail = {
    to: email,
    subject: "Verify email",
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationCode}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: "Verification email sent",
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(401, "Email or password invalid"); //"Email invalid"
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, "Email or password invalid"); //"Password invalid")
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "23h" });
  await authServices.setToken(user._id, token);
  const { username, avatarURL } = user;
  res.json({
    token,
    user: { email, username, avatarURL },
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await authServices.setToken(_id);

  res.json({
    message: "Signout success",
  });
};

const getCurrent = async (req, res) => {
  const { email, avatarURL, username } = req.user;
  console.log(req.user);
  res.json({
    email,
    avatarURL,
    username,
  });
};

const updateSubscription = async (req, res) => {
  const { subscription } = req.body;
  const { _id } = req.user;
  const result = await authServices.setSubscription(_id, subscription);
  res.json(result);
};

// const updateAvatar = async (req, res) => {
//   const { path: oldPath, filename } = req.file;
//   try {
//     const { _id } = req.user;
//     const updatedFile = await Jimp.read(oldPath);
//     updatedFile.resize(250, 250).write(oldPath);
//     const [avatarExtension] = filename.split(".").reverse();
//     const newFileName = path.join(
//       `user_avatar-image_${_id}.${avatarExtension}`
//     );
//     const newPath = path.join(contactsDir, newFileName);
//     await fs.rename(oldPath, newPath);
//     const avatarURL = path.join("avatars", newFileName);
//     await authServices.setAvatar(_id, avatarURL);
//     res.json({ avatarURL });
//   } catch (error) {
//     await fs.unlink(tempStorage);
//     throw error;
//   }
// };

const updateAvatar = async (req, res) => {
  const { email } = req.user;

  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarsDir, filename);

  const file = await Jimp.read(oldPath);
  file.resize(250, 250);

  await fs.rename(oldPath, newPath);
  const avatarURL = path.join("avatars", filename);

  const result = await userServices.updateUser(
    { email },
    { ...req.body, avatarURL }
  );
  if (!result) {
    throw HttpError(401, "Not authorized");
  }
  res.status(200).json({
    avatarURL,
  });
};

export default {
  signup: ctrlWrapper(signup),
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  getCurrent: ctrlWrapper(getCurrent),
  updateSubscription: ctrlWrapper(updateSubscription),
  updateAvatar: ctrlWrapper(updateAvatar),
};
