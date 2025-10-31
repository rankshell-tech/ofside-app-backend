import { Request, Response } from "express";
import User from "../models/User";

/**
 * 🧍 Add a new user
 * Route: POST /api/users
 */
export const createUser = async (req: Request, res: Response) => {
    try {
        const { name, mobile, email, gender, role, favSports, profilePicture } = req.body;

        // Require only mobile (others are optional)
        if (!mobile) {
            return res.status(400).json({ success: false, message: "Mobile number is required" });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ mobile }).lean();
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: "User already exists with this mobile number. Please search for " + existingUser.name,
                existingUser: { id: existingUser._id, name: existingUser.name, mobile: existingUser.mobile },
            });
        }

        // Build user payload only with provided fields
        const userData: Record<string, any> = { mobile };
        if (name) userData.name = name;
        if (email) userData.email = email;
        if (gender) userData.gender = gender;
        if (role) userData.role = role;
        if (favSports !== undefined) userData.favSports = favSports;
        if (profilePicture) userData.profilePicture = profilePicture;

        const user = await User.create(userData);

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user,
        });
    } catch (error) {
        console.error("Error in createUser:", error);
        return res.status(500).json({ success: false, message: "Server error" });
    }
};

/**
 * 🔍 Search users (for player search)
 * Route: GET /api/users/search?q=ash
 */
export const searchUsers = async (req: Request, res: Response) => {
  try {
    const { q  } = req.query;

    if (!q || typeof q !== "string") {
      return res.status(400).json({ success: false, message: "Search query is required" });
    }

    const regex = new RegExp(q, "i"); // case-insensitive search


    const users = await User.find({
      $or: [{ name: regex }, { mobile: regex }, { email: regex }]
    })
      .limit(20)
      .lean();

    return res.json({
      success: true,
      message: "Users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in searchUsers:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 📋 Get all users
 * Route: GET /api/users
 */
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await User.find().lean();
    return res.json({
      success: true,
      message: "All users fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in getAllUsers:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};



/**
 * 📋 Get all venue partners
 * Route: GET /api/users
 */
export const getAllVenuePartners = async (_req: Request, res: Response) => {
  try {
    const users = await User.find({ role: 1 }).lean();
    return res.json({
      success: true,
      message: "All venue partners fetched successfully",
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Error in getAllVenuePartners:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 👤 Get user by ID
 * Route: GET /api/users/:id
 */
export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User fetched successfully",
      user,
    });
  } catch (error) {
    console.error("Error in getUserById:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * ✏️ Update user info
 * Route: PUT /api/users/:id
 */
export const updateUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const user = await User.findByIdAndUpdate(id, updateData, { new: true });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User updated successfully",
      user,
    });
  } catch (error) {
    console.error("Error in updateUser:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

/**
 * 🗑️ Delete user (optional)
 * Route: DELETE /api/users/:id
 */
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await User.findByIdAndDelete(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteUser:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
