const express = require("express");
require("dotenv").config();
const cors = require("cors");
const app = express();
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
// Simple route

app.use(
  cors({
    origin: "http://localhost:3000", // Allow frontend origin only
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed request types
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

// ✅ Manually handle preflight requests
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE");
  res.header("Access-Control-Allow-Headers", "Content-Type,Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200); // Respond immediately to preflight
  }

  next();
});

app.use(express.json());
app.use(cookieParser());
const loginRouter = require("./routes/login");
const bookRouter = require("./routes/book");
const financeRouter = require("./routes/finance");
const medicineRouter = require("./routes/medicine");
app.use("/finance", financeRouter);
app.use("/book", bookRouter);
app.use("/login", loginRouter);
app.use("/med", medicineRouter);
app.get("/", (req, res) => {
  res.send("Hello, World!");
});
app.get("/check", (req, res) => {
  const { token } = req.cookies;
  jwt.verify(token, JWT_SECRET, {}, (err, info) => {
    if (err) throw err;
    res.json(info);
  });
});
// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: "Invalid token" });
    }
    req.user = decoded;
    next();
  });
};

// GET /auth/me - Fetch logged-in user role
app.get("/me", authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { role: true }, // Only fetch the role
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ role: user.role });
  } catch (error) {
    console.error("Error fetching user role:", error);
    res.status(500).json({ error: "Something went wrong" });
  }
});
app.get("/auth/status", async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { firstname: true, email: true, id: true, role: true }, // Add `role` here
    });

    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    console.log(user);
    res.json({ authenticated: true, user });
  } catch (error) {
    console.error(error);
    res.status(401).json({ authenticated: false });
  }
});

// logout
app.post("/logout", (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
  res.json({ message: "Logged out successfully" });
});
// Start the server
app.listen(4000, () => {
  console.log(`Server running on port 4000`);
});
