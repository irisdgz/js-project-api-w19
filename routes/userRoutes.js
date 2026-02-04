import express from "express";
import bcrypt from "bcrypt";
import { User } from "../models/User.js";

const router = express.Router();

// SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });

    if (existingUser) {
      return res.status(400).json({ success: false, message: "User already exists" });
    }

    const salt = bcrypt.genSaltSync();
    const hashedPassword = bcrypt.hashSync(password, salt);
    const user = new User({ email, password: hashedPassword });
    await user.save();

    res.status(201).json({
      success: true,
      response: { email: user.email, id: user._id, accessToken: user.accessToken },
    });
  } catch (error) {
    res.status(400).json({ success: false, response: error });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && bcrypt.compareSync(password, user.password)) {
      res.json({
        success: true,
        response: { email: user.email, id: user._id, accessToken: user.accessToken },
      });
    } else {
      res.status(401).json({ success: false, message: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ success: false, response: error });
  }
});

export default router;