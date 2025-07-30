import express from "express";
import {
  Signup,
  Login,
  Logout,
  onboard,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);
router.post("/onboarding", protectRoute, onboard);
router.get("/me", protectRoute, (req, res) => {
  res.status(200).json({ success: true, user: req.user });
});

//console.log(" Auth routes mounted");

export default router;
