import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
} from "../controllers/user.controller";

const router = express.Router();

// Routes
router.post("/", createUser);
router.get("/", getAllUsers);
router.get("/search", searchUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
