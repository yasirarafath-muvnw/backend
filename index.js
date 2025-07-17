import express from "express";
import connectDB from "./connection/db.js";

import Profile from './models/Profile/index.js'
import User from "./models/User/index.js";
import Task from "./models/Task/index.js";

import { authenticateToken } from "./middleware/auth.js";

import multer from "multer";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';

const jwtSecret = "00000000";

const saltRounds = 10;

const app = express();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})
const upload = multer({ storage: storage })

app.use(express.json());

connectDB();

app.listen(3000, () => console.log("listening at port 3000"));

app.get("/", (req, res) => {
  res.send("Hellow Meo");
});

app.get("/about", (req, res) => {
  res.send("Hellow About Meo");
});

app.get("/career", (req, res) => {
  res.send("Careers");
});

app.post('/api/user', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, name, age, gender, comments } = req.body;

    const newProfile = new Profile({
      firstName,
      lastName,
      email,
      name,
      age,
      gender,
      comments,
    });

    const savedProfile = await newProfile.save();
    res.status(201).json(savedProfile);

  } catch (error) {
    res.status(500).send('Error posting User');
    console.log('error', error);
  }
});

app.put('/api/user/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await Profile.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);

  } catch (error) {
    res.status(500).send('Error updating User');
    console.log('error', error);
  }
});

app.delete('/api/user/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const deletedProfile = await Profile.findByIdAndDelete(id);

    if (!deletedProfile) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User deleted successfully', deletedProfile });

  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

app.get('/api/user/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;

    const isUserFound = await Profile.findById(id);

    if (!isUserFound) {
      return res.status(404).send({ message: 'User Not Found' });
    }

    res.status(200).send({ user: isUserFound });

  } catch (error) {
    res.status(500).send({ message: 'Error finding User' });
    console.log('error', error);
  }
});

app.post('/api/user/upload', authenticateToken, upload.single('file'), function (req, res, next) {
  try {
    console.log('File uploaded:', req.file);
    res.status(201).send('Upload Successful')
  } catch (error) {
    res.status(500).json({ message: 'Error Uploading Picture' })
    console.log('error', error);
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });

  } catch (err) {
    console.error('Signup failed error:', err);
    res.status(500).json({ message: 'Signup failed', error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      jwtSecret,
      { expiresIn: '1h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });

  } catch (err) {
    console.error('Login failed error:', err);
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
});

app.post('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // Automatically extracted from token

    const task = new Task({ title, description, user: userId });
    await task.save();

    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error creating task', error: err.message });
  }
});

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const tasks = await Task.find({ user: userId });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching tasks', error: err.message });
  }
});

app.get('/api/tasks/:id', authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({ _id: req.params.id, user: req.user.userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching task', error: err.message });
  }
});