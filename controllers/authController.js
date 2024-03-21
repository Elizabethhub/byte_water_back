import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { nanoid } from 'nanoid';

import gravatar from 'gravatar';
import Jimp from 'jimp';

import * as authServices from '../services/authServices.js';
import * as userServices from '../services/userServices.js';

import ctrlWrapper from '../decorators/ctrlWrapper.js';

import HttpError from '../helpers/HttpError.js';
import sendEmail from '../helpers/sendEmail.js';
import { generateRandomCode } from '../helpers/generateRandomCode.js';
import { confirmLetterSvg } from '../constants/confirmLetter.js';

const avatarsDir = path.resolve('public', 'avatars');

const { JWT_SECRET, BASE_URL, DEPLOY_HOST } = process.env;

const signup = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (user) {
    throw HttpError(409, 'email already used');
  }
  // const verificationCode = nanoid();
  const avatarURL = gravatar.url(email);
  // const newUser = await authServices.signup({ ...req.body, avatarURL, verificationCode });
  const newUser = await authServices.signup({
    ...req.body,
    avatarURL,
    username: `User${Date.now()}`,
    dailyNorma: 2000,
  });

  res.status(201).json({
    username: newUser.username,
    email: newUser.email,
    avatarURL: avatarURL,
    dailyNorma: newUser.dailyNorma,
  });
};

const verify = async (req, res) => {
  const { verificationCode } = req.params;
  const user = await userServices.findUser({ verificationCode });
  if (!user) {
    throw HttpError(404, 'User not found');
  }
  await userServices.updateUser(
    { _id: user.id },
    { verify: true, verificationCode: '' }
  );
  res.json({
    message: 'Verification successful',
  });
};

const resendVerifyEmail = async (req, res) => {
  const { email } = req.body;
  const user = await userServices.findUser({ email });
  if (!user) {
    throw HttpError(404, 'User not found');
  }
  if (user.verify) {
    throw HttpError(400, 'User already verified');
  }
  const verifyEmail = {
    to: email,
    subject: 'Verify email',
    html: `<a target="_blank" href="${BASE_URL}/api/users/verify/${user.verificationCode}">Click to verify email</a>`,
  };

  await sendEmail(verifyEmail);

  res.json({
    message: 'Verification email sent',
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
  const { username, avatarURL, dailyNorma } = user;
  res.json({
    token,
    user: { email, username, avatarURL, dailyNorma },
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
  const { email } = req.user;

  const result = await userServices.updateUser({ email }, req.body);
  const { avatarURL, gender, email: newEmail, username } = result;

  if (!result) {
    throw HttpError(404);
  }
  res.status(200).json({
    gender,
    username,
    email: newEmail,
    avatarURL,
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

  const { path: oldPath, filename } = req.file;
  const newPath = path.join(avatarsDir, filename);

  const file = await Jimp.read(oldPath);
  file.resize(250, 250);

  await fs.rename(oldPath, newPath);
  const avatarURL = path.join('avatars', filename);

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
 <div
      style="
        justify-content: center;
        display: flex;
        align-items: center;
        flex-direction: column;
        width: 500px;
        margin: 0 auto;
        border: 5px solid #9ebbff;
        border-radius: 20px;
      "
    >
      <p style="font-size: 16px; color: #333; text-align: center; margin-bottom: 20px">
        Good day, ${email} .
      </p>
      ${confirmLetterSvg}

      <p style="font-size: 14px; color: #666; text-align: center">
        Thank you for registering on our website. <br />
        To complete the authorization process, please click on the link below:
      </p>
      <div style="text-align: center; margin-bottom: 20px">
        <a
          target="_blank"
          href="${DEPLOY_HOST}/update-password/${tempCode}"
          style="
            display: inline-block;
            padding: 10px 20px;
            background-color: #407bff;
            color: #fff;
            text-decoration: none;
            border-radius: 5px;
          "
          >Click to update your password!</a
        >
      </div>
      <p style="font-size: 14px; color: #666; text-align: justify">
        If you have not taken this action, ignore this message.
      </p>
      <p style="font-size: 12px; color: #999; text-align: center">
        Best regards, <span style="color: #407bff">Byte me!</span>
      </p>
    </div>`,
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
  verify: ctrlWrapper(verify),
  resendVerifyEmail: ctrlWrapper(resendVerifyEmail),
  signin: ctrlWrapper(signin),
  signout: ctrlWrapper(signout),
  getCurrent: ctrlWrapper(getCurrent),
  updateUserInfo: ctrlWrapper(updateUserInfo),
  updateDailyNorma: ctrlWrapper(updateDailyNorma),
  updateAvatar: ctrlWrapper(updateAvatar),
  forgotPassword: ctrlWrapper(forgotPassword),
  updatePassword: ctrlWrapper(updatePassword),
};
