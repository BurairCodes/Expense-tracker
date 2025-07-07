import express from 'express';

const router = express.Router();

// In-memory storage fallback
let income = [
  {
    _id: '1',
    title: 'Salary',
    amount: 3000.00,
    category: 'Salary',
    description: 'Monthly salary',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

let nextId = 2;

// Function to get Mongoose model, fallback to null if not available
async function getIncomeModel() {
  try {
    const incomeModel = await import('../models/Income.js');
    return incomeModel.default;
  } catch (error) {
    console.log('Using in-memory storage for income');
    return null;
  }
}

// GET /api/income - Get all income with optional filters
router.get('/', async (req, res) => {
  try {
    const Income = await getIncomeModel();
    
    if (Income) {
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

      const incomeData = await Income.find(filters).sort({ date: -1 });
      res.json(incomeData);
    } else {
      const { category, startDate, endDate } = req.query;
      let filteredIncome = [...income];
      
      if (category && category !== 'All') {
        filteredIncome = filteredIncome.filter(inc => inc.category === category);
      }
      
      if (startDate) {
        filteredIncome = filteredIncome.filter(inc => new Date(inc.date) >= new Date(startDate));
      }
      
      if (endDate) {
        filteredIncome = filteredIncome.filter(inc => new Date(inc.date) <= new Date(endDate));
      }
      
      res.json(filteredIncome.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  } catch (error) {
    console.error('Error fetching income:', error);
    res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// GET /api/income/stats/summary - Get income statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const Income = await getIncomeModel();
    
    if (Income) {
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
    } else {
      const total = income.reduce((sum, inc) => sum + inc.amount, 0);
      const count = income.length;
      res.json({ total, count });
    }
  } catch (error) {
    console.error('Error fetching income stats:', error);
    res.status(500).json({ error: 'Failed to fetch income statistics' });
  }
});

// POST /api/income - Create new income
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const Income = await getIncomeModel();

    if (Income) {
      const incomeRecord = new Income({
        title,
        amount,
        category,
        description,
        date: date || new Date()
      });

      const savedIncome = await incomeRecord.save();
      res.status(201).json(savedIncome);
    } else {
      const newIncome = {
        _id: nextId.toString(),
        title,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      income.push(newIncome);
      nextId++;
      res.status(201).json(newIncome);
    }
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
    const Income = await getIncomeModel();

    if (Income) {
      const incomeRecord = await Income.findByIdAndUpdate(
        req.params.id,
        { title, amount, category, description, date },
        { new: true, runValidators: true }
      );

      if (!incomeRecord) {
        return res.status(404).json({ error: 'Income not found' });
      }

      res.json(incomeRecord);
    } else {
      const incomeIndex = income.findIndex(inc => inc._id === req.params.id);
      if (incomeIndex === -1) {
        return res.status(404).json({ error: 'Income not found' });
      }
      
      income[incomeIndex] = {
        ...income[incomeIndex],
        title,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date: date || income[incomeIndex].date
      };
      
      res.json(income[incomeIndex]);
    }
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
    const Income = await getIncomeModel();
    
    if (Income) {
      const incomeRecord = await Income.findByIdAndDelete(req.params.id);
      if (!incomeRecord) {
        return res.status(404).json({ error: 'Income not found' });
      }
    } else {
      const incomeIndex = income.findIndex(inc => inc._id === req.params.id);
      if (incomeIndex === -1) {
        return res.status(404).json({ error: 'Income not found' });
      }
      income.splice(incomeIndex, 1);
    }
    res.json({ message: 'Income deleted successfully' });
  } catch (error) {
    console.error('Error deleting income:', error);
    res.status(500).json({ error: 'Failed to delete income' });
  }
});

export default router;