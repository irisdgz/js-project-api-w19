import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import listEndpoints from "express-list-endpoints";

import userRouter from "./routes/userRoutes.js";
import { User } from "./models/User.js";

const mongoUrl = process.env.MONGO_URL || "mongodb://localhost/happyThoughts";

mongoose
  .connect(mongoUrl)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const port = process.env.PORT || 8080;
const app = express();

app.use(cors());
app.use(express.json());

app.use("/users", userRouter);

// AUTHENTICATION MIDDLEWARE
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken });
    if (user) {
      req.user = user;
      next();
    } else {
      res.status(401).json({ success: false, response: "Please log in" });
    }
  } catch (error) {
    res.status(500).json({ success: false, response: error.message });
  }
};

// MESSAGE MODEL
const Message = mongoose.model(
  "Message",
  new mongoose.Schema({
    message: {
      type: String,
      required: true,
      minlength: 5,
      maxlength: 140,
      trim: true,
    },
    hearts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
  })
);

// ROUTES

// API documentation
app.get("/", (req, res) => {
  res.json({
    message: "Happy Thoughts API",
    endpoints: listEndpoints(app),
  });
});

// GET all thoughts (latest 20)
app.get("/messages", async (req, res) => {
  try {
    const messages = await Message.find()
      .sort({ createdAt: -1 })
      .limit(20);
    res.status(200).json({ success: true, response: messages });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch messages" });
  }
});

// GET a single thought by id
app.get("/messages/:id", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const message = await Message.findById(id);
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.status(200).json({ success: true, response: message });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not fetch message" });
  }
});

// POST a new thought (authenticated)
app.post("/messages", authenticateUser, async (req, res) => {
  try {
    const created = await new Message({ message: req.body.message }).save();
    res.status(201).json({ success: true, response: created });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Could not save message",
      errors: err?.errors,
    });
  }
});

// POST like a thought
app.post("/messages/:id/like", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const updated = await Message.findByIdAndUpdate(
      id,
      { $inc: { hearts: 1 } },
      { new: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.status(200).json({ success: true, response: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not update likes" });
  }
});

// PATCH update a thought (authenticated)
app.patch("/messages/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const updated = await Message.findByIdAndUpdate(
      id,
      { message: req.body.message },
      { new: true, runValidators: true }
    );
    if (!updated) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.status(200).json({ success: true, response: updated });
  } catch (err) {
    res.status(400).json({
      success: false,
      message: "Could not update message",
      errors: err?.errors,
    });
  }
});

// DELETE a thought (authenticated)
app.delete("/messages/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const deleted = await Message.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }
    res.status(200).json({ success: true, response: deleted });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not delete message" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});