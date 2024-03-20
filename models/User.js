import { Schema, model } from 'mongoose';

import { handleSaveError, setUpdateSetting } from './hooks.js';

import { emailRegexp } from '../constants/regexp.js';

const userSchema = new Schema(
  {
    gender: {
      type: String,
    },
    username: {
      type: String,
    },
    email: {
      type: String,
      match: emailRegexp,
      unique: true, // before saving to db - rechecks if email is unique for certain collection
      required: [true, 'Email is required'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },

    dailyNorma: { type: Number, required: [true] },
    avatarURL: { type: String },
    token: {
      type: String,
    },
    tempCode: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post('save', handleSaveError);

userSchema.pre('findByIdAndUpdate', setUpdateSetting);

userSchema.post('findByIdAndUpdate', handleSaveError);

const User = model('user', userSchema);

export default User;
