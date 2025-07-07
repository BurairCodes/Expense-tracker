import express from 'express';

const router = express.Router();

// In-memory storage when MongoDB is not available
let expenses = [];
let nextId = 1;

// GET all expenses
router.get('/', async (req, res) => {
  try {
    // Try to use MongoDB model if available
    try {
      const Expense = (await import('../models/Expense.js')).default;
      const expenses = await Expense.find().sort({ date: -1 });
      res.json(expenses);
    } catch (error) {
      // Fall back to in-memory storage
      res.json(expenses);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new expense
router.post('/', async (req, res) => {
  try {
    const { description, amount, category } = req.body;
    
    // Try to use MongoDB model if available
    try {
      const Expense = (await import('../models/Expense.js')).default;
      const expense = new Expense({ description, amount, category });
      const savedExpense = await expense.save();
      res.status(201).json(savedExpense);
    } catch (error) {
      // Fall back to in-memory storage
      const expense = {
        id: nextId++,
        description,
        amount: parseFloat(amount),
        category,
        date: new Date()
      };
      expenses.push(expense);
      res.status(201).json(expense);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE expense
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to use MongoDB model if available
    try {
      const Expense = (await import('../models/Expense.js')).default;
      await Expense.findByIdAndDelete(id);
      res.json({ message: 'Expense deleted' });
    } catch (error) {
      // Fall back to in-memory storage
      expenses = expenses.filter(expense => expense.id !== parseInt(id));
      res.json({ message: 'Expense deleted' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;