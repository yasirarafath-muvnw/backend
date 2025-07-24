import express from "express";
import connectDB from "./connection/db.js";

import Profile from './models/Profile/index.js'
import User from "./models/User/index.js";
import Task from "./models/Task/index.js";
import Project from "./models/Project/index.js";

import { authenticateToken } from "./middleware/auth.js";

import multer from "multer";
import bcrypt from "bcrypt";
import jwt from 'jsonwebtoken';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import helmet from "helmet";

const jwtSecret = "00000000";

const saltRounds = 10;

dotenv.config();
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
app.use(cors());
app.use(morgan('dev'));

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

// ---------------------------------------------------------------
app.post('/api/user', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId; // from JWT token
    const { firstName, lastName, name, age, gender, comments } = req.body;

    const existingProfile = await Profile.findOne({ user: userId });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists for this user' });
    }

    const newProfile = new Profile({
      user: userId,
      firstName,
      lastName,
      email: req.user.email,
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

// ---------------------------------------------------------------
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

    const signUpPayload = {
      userId: newUser._id,
      email: newUser.email,
    };

    const accessToken = jwt.sign(signUpPayload, jwtSecret, {
      expiresIn: '1h',
    });

    res.status(201).json({
      message: 'User registered successfully',
      accessToken,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
      },
    });

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

// ---------------------------------------------------------------
app.post("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, assignedTo } = req.body;

    const task = new Task({
      title,
      description,
      createdBy: userId,
      assignedTo: assignedTo || null,
    });

    await task.save();
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error creating task", error: err.message });
  }
});

app.get("/api/tasks", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const tasks = await Task.find({ createdBy: userId }).populate("assignedTo", "username email");
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: "Error fetching tasks", error: err.message });
  }
});

app.get("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    }).populate("assignedTo", "username email");

    if (!task) return res.status(404).json({ message: "Task not found" });

    res.status(200).json(task);
  } catch (err) {
    res.status(500).json({ message: "Error fetching task", error: err.message });
  }
});

app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const deletedTask = await Task.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!deletedTask) return res.status(404).json({ message: "Task not found or unauthorized" });

    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting task", error: err.message });
  }
});

app.get('/api/tasks/user/:userId', authenticateToken, async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.userId });
    res.status(200).json(tasks);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching user tasks', error: err.message });
  }
});

app.put("/api/tasks/:id", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    const userId = req.user.userId;

    const validStatuses = ["pending", "in-progress", "completed"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status value" });
    }

    const updatedTask = await Task.findOneAndUpdate(
      { _id: req.params.id, createdBy: userId },
      { status },
      { new: true }
    ).populate("assignedTo", "username email");

    if (!updatedTask) {
      return res.status(404).json({ message: "Task not found or unauthorized" });
    }

    res.status(200).json(updatedTask);
  } catch (err) {
    res.status(500).json({ message: "Error updating task", error: err.message });
  }
});

// ---------------------------------------------------------------
app.post("/api/projects", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const {
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      members,
      tags,
    } = req.body;

    const project = new Project({
      name,
      description,
      status,
      priority,
      startDate,
      endDate,
      createdBy: userId,
      members,
      tags,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error creating project", error: err.message });
  }
});

app.get("/api/projects", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const projects = await Project.find({ createdBy: userId })
      .populate("createdBy", "username email")
      .populate("members", "username email");

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching projects", error: err.message });
  }
});

app.get("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user.userId,
    })
      .populate("createdBy", "username email")
      .populate("members", "username email");

    if (!project) return res.status(404).json({ message: "Project not found" });

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error fetching project", error: err.message });
  }
});

app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const deletedProject = await Project.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user.userId,
    });

    if (!deletedProject)
      return res.status(404).json({ message: "Project not found or unauthorized" });

    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting project", error: err.message });
  }
});

app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const updateFields = req.body;

    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, createdBy: userId },
      updateFields,
      { new: true }
    )
      .populate("createdBy", "username email")
      .populate("members", "username email");

    if (!project)
      return res.status(404).json({ message: "Project not found or unauthorized" });

    res.status(200).json(project);
  } catch (err) {
    res.status(500).json({ message: "Error updating project", error: err.message });
  }
});

app.get("/api/projects/user/:userId", authenticateToken, async (req, res) => {
  try {
    const projects = await Project.find({ members: req.params.userId })
      .populate("createdBy", "username email")
      .populate("members", "username email");

    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user projects", error: err.message });
  }
});