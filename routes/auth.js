const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const SECRET_KEY = "your_secret_key"; // Change this to an environment variable!

// Middleware to verify token and attach user to request
const authenticateUser = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.split(" ")[1]; // Extract token from "Bearer <token>"
        if (!token) return res.status(401).json({ message: "Access denied. No token provided." });

        const decoded = jwt.verify(token, SECRET_KEY);
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) return res.status(401).json({ message: "Invalid token." });

        req.user = user; // Attach user to request
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token." });
    }
};

// Middleware to check user role
const authorizeRole = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) {
        return res.status(403).json({ message: "Access denied." });
    }
    next();
};

module.exports = { authenticateUser, authorizeRole };
