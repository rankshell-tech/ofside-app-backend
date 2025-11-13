import express from "express";
import {
  createUser,
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  searchUsers,
  getAllVenuePartners,
  createUserQuick,
} from "../controllers/user.controller";

const router = express.Router();

// Routes
router.post("/", createUser);
router.post("/quick", createUserQuick);
router.get("/get-all-users", getAllUsers);
router.get("/get-all-venue-partners", getAllVenuePartners);
router.get("/search", searchUsers);
router.get("/:id", getUserById);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
