import { Schema, model } from "mongoose";

import { handleSaveError, setUpdateSetting } from "./hooks.js";

import { emailRegexp } from "../constants/regexp.js";

const userSchema = new Schema(
  {
    username: {
      type: String,
    },
    email: {
      type: String,
      match: emailRegexp,
      unique: true, // before saving to db - rechecks if email is unique for certain collection
      required: [true, "Email is required"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    // verify: {
    //   type: Boolean,
    //   default: false,
    //   required: true,
    // },
    // verificationCode: {
    //   type: String,
    //   required: [true, "Verify token is required"],
    // },
    // subscription: {
    //   type: String,
    //   enum: ["starter", "pro", "business"],
    //   default: "starter",
    // },
    avatarURL: { type: String },
    token: {
      type: String,
    },
  },
  { versionKey: false, timestamps: true }
);

userSchema.post("save", handleSaveError);

userSchema.pre("findByIdAndUpdate", setUpdateSetting);

userSchema.post("findByIdAndUpdate", handleSaveError);

const User = model("user", userSchema);

export default User;
