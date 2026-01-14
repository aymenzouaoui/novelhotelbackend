const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Get single user by ID
exports.getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Create new user
exports.createUser = async (req, res) => {
  try {
    const { username, email, password, role } = req.body;

    // Ensure role is an array (optional safeguard)
    const userRoles = Array.isArray(role) ? role : [role];

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ username, email, password: hashedPassword, role: userRoles });
    await newUser.save();
    res.status(201).json({ message: "User created successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Update user (excluding password)
exports.updateUser = async (req, res) => {
  try {
    const { username, email, role } = req.body;

    const userRoles = Array.isArray(role) ? role : [role]; // ensure it's always an array

    const updated = await User.findByIdAndUpdate(
      req.params.id,
      { username, email, role: userRoles },
      { new: true }
    ).select("-password");

    if (!updated) return res.status(404).json({ error: "User not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};


// Delete user
exports.deleteUser = async (req, res) => {
  try {
    const deleted = await User.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "User not found" });
    res.json({ message: "User deleted" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
};

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(405).json({ error: "User not found" });

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) return res.status(401).json({ error: "Incorrect current password" });

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
