import Profile from '../../models/Profile/index.js';

export const createUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
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
};

export const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await Profile.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json(updatedUser);

  } catch (error) {
    res.status(500).send('Error updating User');
    console.log('error', error);
  }
};

export const deleteUserProfile = async (req, res) => {
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
};

export const getUserProfile = async (req, res) => {
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
};

export const uploadUserFile = (req, res) => {
  try {
    console.log('File uploaded:', req.file);
    res.status(201).send('Upload Successful');
  } catch (error) {
    res.status(500).json({ message: 'Error Uploading Picture' });
    console.log('error', error);
  }
};
