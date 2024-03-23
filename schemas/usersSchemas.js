import Joi from 'joi';
import { emailRegexp } from '../constants/regexp.js';

export const signupSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(), // email() will has different validation than indicated in Schema for email, that's why pattern() is better
  password: Joi.string().min(8).required(),
});

export const signinSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(), // email() will has different validation than indicated in Schema for email, that's why pattern() is better
  password: Joi.string().min(8).required(),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
  username: Joi.string().max(32),
  gender: Joi.string().valid('woman', 'man').required(),
  oldPassword: Joi.string().min(8),
  newPassword: Joi.string().min(8),
});

export const updateDayNorma = Joi.object({
  dailyNorma: Joi.number().min(1).max(15000).required(),
});
export const forgotPasswordSchema = Joi.object({
  email: Joi.string().pattern(emailRegexp).required(),
});
export const updatePasswordSchema = Joi.object({
  newPassword: Joi.string().min(6).required(),
});
