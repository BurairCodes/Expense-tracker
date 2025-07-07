import express from 'express';
import Income from '../models/Income.js';

const router = express.Router();

// GET /api/income - Get all income with optional filters
router.get('/', async (req, res) => {
  try {
    const { category, startDate, endDate } = req.query;
    const filters = {};
    
    if (category && category !== 'All') {
      filters.category = category;
    }
    
    if (startDate) {
      filters.date = { ...filters.date, $gte: new Date(startDate) };
    }
    
    if (endDate) {
      filters.date = { ...filters.date, $lte: new Date(endDate) };
    }

    const income = await Income.find(filters).sort({ date: -1 });
    res.json(income);
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// GET /api/income/stats/summary - Get income statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const totalResult = await Income.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const stats = {
      total: totalResult.length > 0 ? totalResult[0].total : 0,
      count: totalResult.length > 0 ? totalResult[0].count : 0
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching income stats:', error);
    res.status(500).json({ error: 'Failed to fetch income statistics' });
  }
});

// POST /api/income - Create new income
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    const income = new Income({
      title,
      amount,
      category,
      description,
      date: date || new Date()
    });

    const savedIncome = await income.save();
    res.status(201).json(savedIncome);
  } catch (error) {
    console.error('Error creating income:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create income' });
  }
});

// PUT /api/income/:id - Update income
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;

    const income = await Income.findByIdAndUpdate(
      req.params.id,
      { title, amount, category, description, date },
      { new: true, runValidators: true }
    );

    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }

    res.json(income);
  } catch (error) {
    console.error('Error updating income:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update income' });
  }
});

// DELETE /api/income/:id - Delete income
router.delete('/:id', async (req, res) => {
  try {
    const income = await Income.findByIdAndDelete(req.params.id);
    if (!income) {
      return res.status(404).json({ error: 'Income not found' });
    }
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;