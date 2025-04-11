const express = require("express");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcrypt");

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"; // Store securely in .env
const router = express.Router();

router.use(express.json());
router.use(cookieParser()); // No need for CORS middleware here
// normal user
router.post("/register", async (req, res) => {
  const { firstname, lastname, email, password } = req.body; // No role input from user

  if (!firstname || !lastname || !email || !password) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role: "USER", // Default role is USER
      },
    });

    res
      .status(201)
      .json({ message: "User registered successfully", userId: newUser.id });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
// admin user
const authenticateAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;

    if (decoded.role !== "ADMIN") {
      return res.status(403).json({ error: "Access denied. Admins only." });
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: "Invalid token" });
  }
};

router.post("/register/admin", authenticateAdmin, async (req, res) => {
  const { firstname, lastname, email, password, role } = req.body;

  if (!firstname || !lastname || !email || !password || !role) {
    return res.status(400).json({ error: "All fields are required" });
  }

  if (!["ADMIN", "MODERATOR", "USER", "DOCTOR"].includes(role)) {
    return res.status(400).json({ error: "Invalid role" });
  }

  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "Email already in use" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        firstname,
        lastname,
        email,
        password: hashedPassword,
        role,
      },
    });

    res
      .status(201)
      .json({ message: "Admin-created user registered", userId: newUser.id });
  } catch (error) {
    console.error("Admin registration error:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

// Login Route
router.post("/login", async function (req, res) {
  console.log(req.body);
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const token = jwt.sign({ userId: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 3600000,
      sameSite: "strict",
    });

    return res.status(200).json({ message: "Login successful" });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Database error" });
  }
});

module.exports = router;

// router.post("/register", async (req, res) => {
//   const { firstname, lastname, email, password, role } = req.body;

//   if (!firstname || !lastname || !email || !password || !role) {
//     return res.status(400).json({ error: "All fields are required" });
//   }

//   try {
//     const existingUser = await prisma.user.findUnique({ where: { email } });
//     if (existingUser) {
//       return res.status(400).json({ error: "Email already in use" });
//     }

//     const hashedPassword = await bcrypt.hash(password, 10);

//     const newUser = await prisma.user.create({
//       data: {
//         firstname,
//         lastname,
//         email,
//         password: hashedPassword,
//         role,
//         doctor: role === "DOCTOR" ? { create: {} } : undefined, // Creates a doctor record if role is DOCTOR
//       },
//     });

//     res
//       .status(201)
//       .json({ message: "User registered successfully", userId: newUser.id });
//   } catch (error) {
//     console.error("Registration error:", error);
//     res.status(500).json({ error: "Something went wrong" });
//   }
// });
