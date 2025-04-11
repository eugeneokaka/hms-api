const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();
router.post("/order", async (req, res) => {
  try {
    const { supplier, recipient, price } = req.body;

    // Basic validation
    if (!supplier || !recipient || price == null) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Helper function to generate random integer
    function getRandomInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1) + min);
    }

    // Generate unique order number
    async function generateUniqueOrderNumber() {
      let unique = false;
      let orderNumber;

      while (!unique) {
        orderNumber = getRandomInt(1000, 99999).toString();
        const existingOrder = await prisma.order.findFirst({
          where: { orderNumber },
        });

        if (!existingOrder) {
          unique = true;
        }
      }

      return orderNumber;
    }

    const orderNumber = await generateUniqueOrderNumber();

    // Create order
    const createdOrder = await prisma.order.create({
      data: {
        supplier,
        recipient,
        price,
        orderNumber,
      },
    });

    res.status(201).json(createdOrder);
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.post("/medicine", async (req, res) => {
  try {
    const {
      name,
      category,
      manufacturer,
      description,
      quantity,
      price,
      expiryDate,
      orderId, // optional
    } = req.body;

    // Basic validation
    if (
      !name ||
      !category ||
      !manufacturer ||
      !description ||
      quantity == null ||
      price == null ||
      !expiryDate
    ) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Optional: check if orderId is valid
    if (orderId) {
      const orderExists = await prisma.Order.findUnique({
        where: { id: orderId },
      });

      if (!orderExists) {
        return res.status(404).json({ error: "Order not found" });
      }
    }

    // Create medicine
    const newMedicine = await prisma.medicine.create({
      data: {
        name,
        category,
        manufacturer,
        description,
        quantity,
        price,
        expiryDate: new Date(expiryDate),
        orderId: orderId || null,
      },
    });

    res.status(201).json(newMedicine);
  } catch (error) {
    console.error("Error creating medicine:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/medicines/search", async (req, res) => {
  try {
    const { name, category, startDate } = req.query;

    // Build the filter object dynamically based on provided query params
    const filters = {};

    // Add search by name if present
    if (name) {
      filters.name = {
        contains: name.toString(),
      };
    }

    // Add filter by category if present
    if (category) {
      filters.category = {
        contains: category.toString(),
      };
    }

    // Add filter by startDate if present
    if (startDate) {
      filters.createdAt = {
        gte: new Date(startDate), // Greater than or equal to the provided startDate
      };
    }

    // Fetch the medicines from the database using the filters
    const medicines = await prisma.medicine.findMany({
      where: filters,
      orderBy: {
        createdAt: "desc", // Order by latest creation date
      },
      take: 5, // Limit to 5 results (adjust as needed)
    });

    res.json(medicines);
  } catch (error) {
    console.error("Error searching and filtering medicines:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
router.get("/expires", async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
      23,
      59,
      59
    );

    const expiringMedicines = await prisma.medicine.findMany({
      where: {
        expiryDate: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
      orderBy: {
        expiryDate: "asc",
      },
    });

    res.status(200).json({
      status: "success",
      message: "Medicines expiring this month",
      data: expiringMedicines,
    });
  } catch (error) {
    console.error("Error fetching expiring medicines:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});
router.get("/medicines", async (req, res) => {
  try {
    const medicines = await prisma.medicine.findMany({
      include: {
        order: true, // Include order details (like supplier, orderNumber)
        prescriptions: true, // Optionally include prescriptions
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    res.status(200).json({
      status: "success",
      message: "Fetched all medicines",
      data: medicines,
    });
  } catch (error) {
    console.error("Error fetching medicines:", error);
    res.status(500).json({ status: "error", message: "Internal Server Error" });
  }
});
module.exports = router;
