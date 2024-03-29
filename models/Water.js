import { Schema, model } from 'mongoose';

import { handleSaveError, setUpdateSetting } from './hooks.js';

const waterSchema = new Schema(
  {
    milliliters: {
      type: Number,
      required: [true, 'Milliliters is required'],
    },
    time: {
      type: Date,
      required: [true, 'Time is required'],
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'users',
      required: true,
    },
  },
  { versionKey: false, timestamps: true }
);

waterSchema.post('save', handleSaveError);

// userSchema.pre("findByIdAndUpdate", setUpdateSetting);

// userSchema.post("findByIdAndUpdate", handleSaveError);

const Water = model('water', waterSchema, 'waters-data');

export default Water;
