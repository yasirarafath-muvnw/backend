import express from "express";
import connectDB from "./connection/db.js";

import Profile from './models/User/index.js'

const app = express();
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

app.post('/api/user', async (req, res) => {
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
})

app.put('/api/user/:id', async (req, res) => {
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
})

app.delete('/api/user/:id', async (req, res) => {
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

app.get('/api/user/:id', async (req, res) => {
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
})

