import mongoose from "mongoose";
import crypto from "crypto";

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  accessToken: {
    type: String,
    // this generates a long random string as the user's secret token
    default: () => crypto.randomBytes(128).toString("hex"),
  },
});

export const User = mongoose.model("User", UserSchema);