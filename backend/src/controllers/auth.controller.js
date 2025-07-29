import { upsertStreamUser } from "../lib/stream.js";
import User from "../models/user.models.js";
import jwt from "jsonwebtoken";

export const Signup = async (req, res) => {
  const { email, password, fullName } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.json({ success: false, message: "Missing details" });
    }

    if (password.length < 6) {
      return res.json({
        success: false,
        message: "password must be atleast 6 characters",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid email format" });
    }
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.json({ success: false, message: "account already exists" });
    }

    const index = Math.floor(Math.random() * 100) + 1; //generate a random no b/w 1-100(included)
    const randomAvatar = `https://avatar.iran.liara.run/public/${index}.png`;
    const newUser = await User.create({
      email,
      fullName,
      password,
      profilePic: randomAvatar,
    });

    try {
      await upsertStreamUser({
        id: newUser._id.toString(),
        name: newUser.fullName,
        image: newUser.profilePic || "",
      });
      console.log(`Stream User created for ${newUser.fullName}`);
    } catch (error) {
      console.log("Error creating stream user", error);
    }

    //todo:create the user in stream as well
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });
    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      user: newUser,
      message: "Account created successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error while signing up" });
  }
};

//tdo:do it later
export const Login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "all fields are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const isPasswordCorrect = await user.matchPassword(password);
    if (!isPasswordCorrect) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.cookie("jwt", token, {
      maxAge: 7 * 24 * 60 * 60 * 1000,
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.status(201).json({
      success: true,
      user: user,
      message: "Account logged in successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

export const Logout = async (req, res) => {
  res.clearCookie("jwt");
  res.status(200).json({ success: true, message: "logged out successfully" });
};

export const onboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullName, bio, nativeLanguage, learningLanguage, location } =
      req.body;
    if (
      !fullName ||
      !bio ||
      !nativeLanguage ||
      !learningLanguage ||
      !location
    ) {
      return res.status(400).json({
        message: "all fields are required",
        missingFields: [
          !fullName && "fullName",
          !bio && "bio",
          !nativeLanguage && "nativeLanguage",
          !learningLanguage && "learningLanguage",
          !location && "loaction",
        ].filter(Boolean),
      });
    }
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...req.body,
        isOnboarded: true,
      },
      { new: true }
    );
    if (!updatedUser) {
      res.status(404).json({
        success: false,
        message: "user not found",
      });
    }
    try {
      await upsertStreamUser({
        id: updatedUser._id.toString(),
        name: updatedUser.fullName,
        image: updatedUser.profilePic || "",
      });
      console.log(`Stream User updated for ${updatedUser.fullName}`);
    } catch (error) {
      console.log("Error creating stream user", error);
    }

    res.status(200).json({ success: true, user: updatedUser });
  } catch (error) {
    console.log("onboarding error", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
