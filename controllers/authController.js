import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';

import gravatar from 'gravatar';

import * as authServices from '../services/authServices.js';
import * as userServices from '../services/userServices.js';

import ctrlWrapper from '../decorators/ctrlWrapper.js';

import HttpError from '../helpers/HttpError.js';
import sendEmail from '../helpers/sendEmail.js';
import { generateRandomCode } from '../helpers/generateRandomCode.js';
// import { imgWaterLogo } from '../constants/waterTrackerImg.png';
import cloudinary from '../helpers/cloudinary.js';
// import { confirmLetterSvg } from '../constants/confirmLetter.js';

const { JWT_SECRET, DEPLOY_HOST } = process.env;

const signup = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (user) {
    throw HttpError(409, 'email already used');
  }
  const avatarURL = gravatar.url(email);
  const newUser = await authServices.signup({
    ...req.body,
    avatarURL,
    username: `User${Date.now()}`,
    dailyNorma: 2000,
    gender: 'woman',
  });

  res.status(201).json({
    username: newUser.username,
    email: newUser.email,
    avatarURL: avatarURL,
    dailyNorma: newUser.dailyNorma,
    gender: newUser.gender,
  });
};

const signin = async (req, res) => {
  const { email, password } = req.body;
  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(401, 'Email or password invalid'); //"Email invalid"
  }
  const passwordCompare = await bcrypt.compare(password, user.password);
  if (!passwordCompare) {
    throw HttpError(401, 'Email or password invalid'); //"Password invalid")
  }
  const payload = { id: user._id };
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '23h' });
  await authServices.setToken(user._id, token);
  const { username, avatarURL, dailyNorma, gender } = user;
  res.json({
    token,
    user: { email, username, avatarURL, dailyNorma, gender },
  });
};

const signout = async (req, res) => {
  const { _id } = req.user;
  await authServices.setToken(_id);

  res.json({
    message: 'Signout success',
  });
};

const getCurrent = async (req, res) => {
  const { email, avatarURL, username, dailyNorma, gender } = req.user;
  res.json({
    email,
    avatarURL,
    username,
    gender,
    dailyNorma,
  });
};

const updateUserInfo = async (req, res) => {
  const { email, password } = req.user;
  const { oldPassword, newPassword } = req.body;

  const user = await userServices.findUser({ email });

  if (!user) {
    throw HttpError(404, 'Such user does not exist');
  }
  if (oldPassword) {
    const oldPasswordCompare = await bcrypt.compare(oldPassword, password);
    if (!oldPasswordCompare) {
      throw HttpError(400, 'The old password is wrong');
    }
  }
  if (newPassword) {
    const passwordCompare = await bcrypt.compare(newPassword, password);
    if (passwordCompare) {
      throw HttpError(
        400,
        'The new password must be different from the old one'
      );
    }
  }

  const result = await userServices.updateUser({ email }, req.body);
  const { avatarURL, gender, email: newEmail, username, dailyNorma } = result;

  if (!result) {
    throw HttpError(404, 'Such user does not exist');
  }
  res.status(200).json({
    gender,
    username,
    email: newEmail,
    avatarURL,
    dailyNorma,
  });
};

const updateDailyNorma = async (req, res) => {
  const { dailyNorma } = req.body;
  const { _id } = req.user;
  await authServices.setDailyNorma(_id, dailyNorma);
  res.json({ message: 'Successfully updated', dailyNorma });
};

const updateAvatar = async (req, res) => {
  const { email } = req.user;
  const { url: avatarURL } = await cloudinary.uploader.upload(req.file.path, {
    folder: 'avatars',
  });
  const { path: oldPath } = req.file;

  await fs.rm(oldPath);

  const result = await userServices.updateUser(
    { email },
    { ...req.body, avatarURL }
  );
  if (!result) {
    throw HttpError(404);
  }
  res.status(200).json({
    avatarURL,
  });
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(404, 'User not found');
  }

  const tempCode = generateRandomCode();

  await userServices.updateUser({ email }, { tempCode });
  const userEmail = {
    to: email,
    subject: 'Forgot password',
    html: `
    <table style="width: 500px; margin: 0 auto; border: 5px solid #9ebbff; border-radius: 20px;">
    <tr>
      <td style="text-align: center;">
        <p style="font-size: 16px; color: #333; margin-bottom: 20px;">Good day, ${email} .</p>
      </td>
    </tr>
    <tr>
      <td>
       <img src="https://i.ibb.co/TkY6Zf6/water-Tracker-Img.png" alt="water-Tracker-Img" border="0" style="display: block; width: 102px; margin: 0 auto;"> </td>
      </tr>
    <tr>
      <td style="text-align: center;">
        <p style="font-size: 14px; color: #666;">Thank you for registering on our website. <br /> To complete the authorization process, please click on the link below:</p>
        <div style="margin-bottom: 20px;">
          <a href="${DEPLOY_HOST}/update-password/${tempCode}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #407bff; color: #fff; text-decoration: none; border-radius: 5px;">Click to update your password!</a>
        </div>
        <p style="font-size: 14px; color: #666; text-align: center;">If you have not taken this action, ignore this message.</p>
        <p style="font-size: 12px; color: #999; text-align: center;">Best regards, <span style="color: #407bff;">Byte me!</span></p>
      </td>
    </tr>
  </table>`,
  };

  await sendEmail(userEmail);

  res.json({
    message: 'Forgot password email sent',
  });
};

const updatePassword = async (req, res) => {
  const { tempCode } = req.params;
  const { newPassword } = req.body;

  const user = await userServices.findUser({ tempCode });
  if (!user) {
    throw HttpError(404, 'User not found');
  }
  const passwordCompare = await bcrypt.compare(newPassword, user.password);
  if (passwordCompare) {
    throw HttpError(401, 'The old password is the same as the new one');
  }

  await authServices.updatePassword(tempCode, {
    password: newPassword,
    tempCode: undefined,
  });

  res.status(200).json({
    message: 'Your password updated successful',
  });
};

export default {
  signup: ctrlWrapper(signup),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  getCurrent: ctrlWrapper(getCurrent),
  updateUserInfo: ctrlWrapper(updateUserInfo),
  updateDailyNorma: ctrlWrapper(updateDailyNorma),
  updateAvatar: ctrlWrapper(updateAvatar),
  forgotPassword: ctrlWrapper(forgotPassword),
  updatePassword: ctrlWrapper(updatePassword),
};
