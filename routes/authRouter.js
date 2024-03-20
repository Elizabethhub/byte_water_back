import express from 'express';

import authController from '../controllers/authController.js';

import validateBody from '../decorators/validateBody.js';

import {
  signupSchema,
  signinSchema,
  updateUserSchema,
  updateDayNorma,
  verifySchema,
  forgotPasswordSchema,
  updatePasswordSchema,
} from '../schemas/usersSchemas.js';

import authenticate from '../middlewares/authenticate.js';

import upload from '../middlewares/upload.js';

const authRouter = express.Router();

authRouter.post('/register', validateBody(signupSchema), authController.signup);

authRouter.get('/verify/:verificationCode', authController.verify);

authRouter.post(
  '/verify',
  validateBody(verifySchema),
  authController.resendVerifyEmail
);

authRouter.post('/login', validateBody(signinSchema), authController.signin);

authRouter.post('/logout', authenticate, authController.signout);

authRouter.get('/current', authenticate, authController.getCurrent);

authRouter.patch(
  '/update-user',
  authenticate,
  validateBody(updateUserSchema),
  authController.updateUserInfo
);

authRouter.patch(
  '/avatars',
  authenticate,
  upload.single('avatarURL'),
  authController.updateAvatar
);
//update dailyNorma
authRouter.patch(
  '/',
  authenticate,
  validateBody(updateDayNorma),
  authController.updateDailyNorma
);

authRouter.post(
  '/forgot-password',
  validateBody(forgotPasswordSchema),
  authController.forgotPassword
);
authRouter.post(
  '/update-password/:tempCode',
  validateBody(updatePasswordSchema),
  authController.updatePassword
);

export default authRouter;
