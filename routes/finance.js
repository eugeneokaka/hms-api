const express = require("express");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
const router = express.Router();

// 🟢 Create a Transaction (Income or Expense)
router.post("/transaction", async (req, res) => {
  try {
    const { type, amount, category, description } = req.body;

    if (!type || !amount || !category) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    if (!["INCOME", "EXPENSE"].includes(type)) {
      return res.status(400).json({ error: "Invalid transaction type" });
    }

    // Create the transaction
    const transaction = await prisma.transaction.create({
      data: { type, amount, category, description },
    });

    // Find or create the Finance record
    let finance = await prisma.finance.findFirst();
    if (!finance) {
      finance = await prisma.finance.create({
        data: { income: 0, expenses: 0, netProfit: 0 },
      });
    }

    // Convert Decimal fields to Number for calculations
    const income = Number(finance.income);
    const expenses = Number(finance.expenses);
    const transactionAmount = Number(amount);

    // Update finance values based on transaction type
    let updatedIncome = income;
    let updatedExpenses = expenses;

    if (type === "INCOME") {
      updatedIncome += transactionAmount;
    } else if (type === "EXPENSE") {
      updatedExpenses += transactionAmount;
    }

    const netProfit = updatedIncome - updatedExpenses;

    // Save updated finance data
    const updatedFinance = await prisma.finance.update({
      where: { id: finance.id },
      data: {
        income: updatedIncome,
        expenses: updatedExpenses,
        netProfit: netProfit,
      },
    });

    res.status(201).json({ transaction, updatedFinance });
  } catch (error) {
    console.error("Error creating transaction:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔵 Get All Transactions
router.get("/transactions", async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
    });
    res.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🟠 Get Finance Overview
router.get("/finance", async (req, res) => {
  try {
    let finance = await prisma.finance.findFirst();
    if (!finance) {
      finance = await prisma.finance.create({
        data: { income: 0, expenses: 0, netProfit: 0 },
      });
    }
    res.json(finance);
  } catch (error) {
    console.error("Error fetching finance data:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/most-category", async (req, res) => {
  try {
    const categories = await prisma.transaction.groupBy({
      by: ["category"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 3,
    });
    console.log(categories);

    res.json({
      category: categories || "No transactions",
      transactionCount: categories[0]?._count.id || 0,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
});

router.get("/most-expensive", async (req, res) => {
  try {
    const transaction = await prisma.transaction.findFirst({
      orderBy: { amount: "desc" },
    });

    if (!transaction) {
      return res.json({ message: "No transactions found" });
    }

    res.json(transaction);
  } catch (error) {
    res.status(500).json({ error: "Error fetching data" });
  }
});

module.exports = router;
