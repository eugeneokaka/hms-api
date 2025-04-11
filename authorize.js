const express = require("express");
const authenticate = require("./authenticate"); // Your JWT auth middleware
const authorize = require("./authorize"); // Role-based auth middleware
const router = express.Router();
// auautharise
const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized. Please log in." });
    }

    if (!roles.includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Access denied. Insufficient permissions." });
    }

    next(); // User has required role, proceed to next middleware/route
  };
};

module.exports = authorize;

// Example routes with role-based access control
router.get("/admin", authenticate, authorize(["ADMIN"]), (req, res) => {
  res.status(200).json({ message: "Welcome, Admin!" });
});

router.get(
  "/doctor-dashboard",
  authenticate,
  authorize(["DOCTOR"]),
  (req, res) => {
    res.status(200).json({ message: "Welcome, Doctor!" });
  }
);

router.get(
  "/patient-portal",
  authenticate,
  authorize(["PATIENT"]),
  (req, res) => {
    res.status(200).json({ message: "Welcome, Patient!" });
  }
);

module.exports = router;
