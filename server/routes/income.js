import express from 'express';

const router = express.Router();

// In-memory storage when MongoDB is not available
let incomes = [];
let nextId = 1;

// GET all income
router.get('/', async (req, res) => {
  try {
    // Try to use MongoDB model if available
    try {
      const Income = (await import('../models/Income.js')).default;
      const incomes = await Income.find().sort({ date: -1 });
      res.json(incomes);
    } catch (error) {
      // Fall back to in-memory storage
      res.json(incomes);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new income
router.post('/', async (req, res) => {
  try {
    const { description, amount, source } = req.body;
    
    // Try to use MongoDB model if available
    try {
      const Income = (await import('../models/Income.js')).default;
      const income = new Income({ description, amount, source });
      const savedIncome = await income.save();
      res.status(201).json(savedIncome);
    } catch (error) {
      // Fall back to in-memory storage
      const income = {
        id: nextId++,
        description,
        amount: parseFloat(amount),
        source,
        date: new Date()
      };
      incomes.push(income);
      res.status(201).json(income);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE income
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to use MongoDB model if available
    try {
      const Income = (await import('../models/Income.js')).default;
      await Income.findByIdAndDelete(id);
      res.json({ message: 'Income deleted' });
    } catch (error) {
      // Fall back to in-memory storage
      incomes = incomes.filter(income => income.id !== parseInt(id));
      res.json({ message: 'Income deleted' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;