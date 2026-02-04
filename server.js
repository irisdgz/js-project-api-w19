import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import "dotenv/config";
import listEndpoints from "express-list-endpoints";

// 1. Import your new User router and User model
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

// 2. Add the User Router (this enables /signup and /login)
app.use(userRouter);

// 3. AUTHENTICATION MIDDLEWARE
// This function sits between the request and the actual route logic
const authenticateUser = async (req, res, next) => {
  const accessToken = req.header("Authorization");
  try {
    const user = await User.findOne({ accessToken: accessToken });
    if (user) {
      req.user = user; // Makes the user available in req.user
      next(); // Success! Go to the next function
    } else {
      res.status(401).json({ success: false, response: "Please log in" });
    }
  } catch (error) {
    res.status(500).json({ success: false, response: error.message });
  }
};

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

// --- ROUTES ---

app.get("/", (req, res) => {
  res.json({
    message: "Happy Thoughts API",
    endpoints: listEndpoints(app),
  });
});

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

// 4. PROTECTED POST ROUTE
// Only users with a valid token can post now
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

// --- REMAINING ROUTES ---

app.post("/messages/:id/like", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ success: false, message: "Invalid ID" });
  }
  try {
    const updated = await Message.findByIdAndUpdate(id, { $inc: { hearts: 1 } }, { new: true });
    if (!updated) return res.status(404).json({ success: false, message: "Not found" });
    res.status(200).json({ success: true, response: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Could not update likes" });
  }
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});