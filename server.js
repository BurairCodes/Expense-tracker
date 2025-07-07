import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// In-memory storage
let transactions = [
  {
    id: '1',
    type: 'expense',
    title: 'Grocery Shopping',
    amount: 85.50,
    category: 'Food',
    date: '2024-01-15',
    description: 'Weekly groceries'
  },
  {
    id: '2',
    type: 'income',
    title: 'Salary',
    amount: 3000.00,
    category: 'Salary',
    date: '2024-01-01',
    description: 'Monthly salary'
  },
  {
    id: '3',
    type: 'expense',
    title: 'Gas',
    amount: 45.00,
    category: 'Transportation',
    date: '2024-01-14',
    description: 'Car fuel'
  }
];

let nextId = 4;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// API Routes
app.get('/api/transactions', (req, res) => {
  const { type, category } = req.query;
  let filtered = [...transactions];
  
  if (type) {
    filtered = filtered.filter(t => t.type === type);
  }
  
  if (category && category !== 'all') {
    filtered = filtered.filter(t => t.category === category);
  }
  
  res.json(filtered.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.post('/api/transactions', (req, res) => {
  const transaction = {
    id: nextId.toString(),
    ...req.body,
    amount: parseFloat(req.body.amount)
  };
  
  transactions.push(transaction);
  nextId++;
  
  res.status(201).json(transaction);
});

app.put('/api/transactions/:id', (req, res) => {
  const index = transactions.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  transactions[index] = {
    ...transactions[index],
    ...req.body,
    amount: parseFloat(req.body.amount)
  };
  
  res.json(transactions[index]);
});

app.delete('/api/transactions/:id', (req, res) => {
  const index = transactions.findIndex(t => t.id === req.params.id);
  
  if (index === -1) {
    return res.status(404).json({ error: 'Transaction not found' });
  }
  
  transactions.splice(index, 1);
  res.json({ message: 'Transaction deleted' });
});

app.get('/api/summary', (req, res) => {
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const balance = income - expenses;
  
  // Category breakdown for expenses
  const categoryBreakdown = {};
  transactions
    .filter(t => t.type === 'expense')
    .forEach(t => {
      categoryBreakdown[t.category] = (categoryBreakdown[t.category] || 0) + t.amount;
    });
  
  res.json({
    income,
    expenses,
    balance,
    categoryBreakdown
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});