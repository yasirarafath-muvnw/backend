import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../../models/User/index.js';

const saltRounds = 10;
const jwtSecret = "00000000";

export const signup = async (req, res) => {
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
};

export const login = async (req, res) => {
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
};