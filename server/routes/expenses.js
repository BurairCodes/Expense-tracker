import express from 'express';

const router = express.Router();

// In-memory storage fallback
let expenses = [
  {
    _id: '1',
    title: 'Grocery Shopping',
    amount: 85.50,
    category: 'Food',
    description: 'Weekly grocery shopping',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  },
  {
    _id: '2',
    title: 'Gas Station',
    amount: 45.00,
    category: 'Transportation',
    description: 'Fuel for car',
    date: new Date().toISOString(),
    createdAt: new Date().toISOString()
  }
];

let nextId = 3;

// Function to get Mongoose model, fallback to null if not available
async function getExpenseModel() {
  try {
    const expenseModel = await import('../models/Expense.js');
    return expenseModel.default;
  } catch (error) {
    console.log('Using in-memory storage for expenses');
    return null;
  }
}

// GET /api/expenses - Get all expenses with optional filters
router.get('/', async (req, res) => {
  try {
    const Expense = await getExpenseModel();
    
    if (Expense) {
      // Use MongoDB
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

      const expenseData = await Expense.find(filters).sort({ date: -1 });
      res.json(expenseData);
    } else {
      // Use in-memory storage
      const { category, startDate, endDate } = req.query;
      let filteredExpenses = [...expenses];
      
      if (category && category !== 'All') {
        filteredExpenses = filteredExpenses.filter(exp => exp.category === category);
      }
      
      if (startDate) {
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) >= new Date(startDate));
      }
      
      if (endDate) {
        filteredExpenses = filteredExpenses.filter(exp => new Date(exp.date) <= new Date(endDate));
      }
      
      res.json(filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET /api/expenses/stats/summary - Get expense statistics
router.get('/stats/summary', async (req, res) => {
  try {
    const Expense = await getExpenseModel();
    
    if (Expense) {
      // Use MongoDB
      const totalResult = await Expense.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);

      const categoryStats = await Expense.aggregate([
        {
          $group: {
            _id: '$category',
            total: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        },
        {
          $sort: { total: -1 }
        }
      ]);

      const stats = {
        total: totalResult.length > 0 ? totalResult[0].total : 0,
        count: totalResult.length > 0 ? totalResult[0].count : 0,
        categories: categoryStats
      };

      res.json(stats);
    } else {
      // Use in-memory storage
      const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
      const count = expenses.length;
      
      const categoryTotals = {};
      expenses.forEach(exp => {
        if (!categoryTotals[exp.category]) {
          categoryTotals[exp.category] = { total: 0, count: 0 };
        }
        categoryTotals[exp.category].total += exp.amount;
        categoryTotals[exp.category].count += 1;
      });
      
      const categories = Object.entries(categoryTotals)
        .map(([category, data]) => ({
          _id: category,
          total: data.total,
          count: data.count
        }))
        .sort((a, b) => b.total - a.total);
      
      res.json({ total, count, categories });
    }
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// GET /api/expenses/:id - Get single expense
router.get('/:id', async (req, res) => {
  try {
    const Expense = await getExpenseModel();
    
    if (Expense) {
      const expense = await Expense.findById(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    } else {
      const expense = expenses.find(exp => exp._id === req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      res.json(expense);
    }
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// POST /api/expenses - Create new expense
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const Expense = await getExpenseModel();

    if (Expense) {
      const expense = new Expense({
        title,
        amount,
        category,
        description,
        date: date || new Date()
      });

      const savedExpense = await expense.save();
      res.status(201).json(savedExpense);
    } else {
      const newExpense = {
        _id: nextId.toString(),
        title,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      expenses.push(newExpense);
      nextId++;
      res.status(201).json(newExpense);
    }
  } catch (error) {
    console.error('Error creating expense:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// PUT /api/expenses/:id - Update expense
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, description, date } = req.body;
    const Expense = await getExpenseModel();

    if (Expense) {
      const expense = await Expense.findByIdAndUpdate(
        req.params.id,
        { title, amount, category, description, date },
        { new: true, runValidators: true }
      );

      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }

      res.json(expense);
    } else {
      const expenseIndex = expenses.findIndex(exp => exp._id === req.params.id);
      if (expenseIndex === -1) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      
      expenses[expenseIndex] = {
        ...expenses[expenseIndex],
        title,
        amount: parseFloat(amount),
        category,
        description: description || '',
        date: date || expenses[expenseIndex].date
      };
      
      res.json(expenses[expenseIndex]);
    }
  } catch (error) {
    console.error('Error updating expense:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete('/:id', async (req, res) => {
  try {
    const Expense = await getExpenseModel();
    
    if (Expense) {
      const expense = await Expense.findByIdAndDelete(req.params.id);
      if (!expense) {
        return res.status(404).json({ error: 'Expense not found' });
      }
    } else {
      const expenseIndex = expenses.findIndex(exp => exp._id === req.params.id);
      if (expenseIndex === -1) {
        return res.status(404).json({ error: 'Expense not found' });
      }
      expenses.splice(expenseIndex, 1);
    }
    res.json({ message: 'Expense deleted successfully' });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

export default router;