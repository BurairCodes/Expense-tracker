import express from 'express';

const router = express.Router();

// In-memory storage fallback
let scheduledCharges = [
  {
    _id: '1',
    title: 'Netflix Subscription',
    amount: 15.99,
    category: 'Entertainment',
    frequency: 'monthly',
    description: 'Monthly streaming subscription',
    date: new Date().toISOString(),
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

let nextId = 2;

// Deferred loading of Mongoose model
const getScheduledChargeModel = (async () => {
  try {
    const scheduledModel = await import('../models/ScheduledCharge.js');
    return scheduledModel.default;
  } catch (error) {
    console.log('Using in-memory storage for scheduled charges');
    return null;
  }
})();

// GET /api/scheduled - Get all scheduled charges
router.get('/', async (req, res) => {
  try {
    const ScheduledCharge = await getScheduledChargeModel;
    
    if (ScheduledCharge) {
      const { category, frequency } = req.query;
      const filters = { isActive: true };
      
      if (category && category !== 'All') {
        filters.category = category;
      }
      
      if (frequency) {
        filters.frequency = frequency;
      }

      const scheduledData = await ScheduledCharge.find(filters).sort({ date: -1 });
      res.json(scheduledData);
    } else {
      const { category, frequency } = req.query;
      let filteredCharges = scheduledCharges.filter(charge => charge.isActive);
      
      if (category && category !== 'All') {
        filteredCharges = filteredCharges.filter(charge => charge.category === category);
      }
      
      if (frequency) {
        filteredCharges = filteredCharges.filter(charge => charge.frequency === frequency);
      }
      
      res.json(filteredCharges.sort((a, b) => new Date(b.date) - new Date(a.date)));
    }
  } catch (error) {
    console.error('Error fetching scheduled charges:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled charges' });
  }
});

// POST /api/scheduled - Create new scheduled charge
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, frequency, description, date } = req.body;
    const ScheduledCharge = await getScheduledChargeModel;

    if (ScheduledCharge) {
      const scheduledCharge = new ScheduledCharge({
        title,
        amount,
        category,
        frequency,
        description,
        date: date || new Date()
      });

      const savedScheduledCharge = await scheduledCharge.save();
      res.status(201).json(savedScheduledCharge);
    } else {
      const newScheduledCharge = {
        _id: nextId.toString(),
        title,
        amount: parseFloat(amount),
        category,
        frequency,
        description: description || '',
        date: date || new Date().toISOString(),
        isActive: true,
        createdAt: new Date().toISOString()
      };
      
      scheduledCharges.push(newScheduledCharge);
      nextId++;
      res.status(201).json(newScheduledCharge);
    }
  } catch (error) {
    console.error('Error creating scheduled charge:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to create scheduled charge' });
  }
});

// PUT /api/scheduled/:id - Update scheduled charge
router.put('/:id', async (req, res) => {
  try {
    const { title, amount, category, frequency, description, date } = req.body;
    const ScheduledCharge = await getScheduledChargeModel;

    if (ScheduledCharge) {
      const scheduledCharge = await ScheduledCharge.findByIdAndUpdate(
        req.params.id,
        { title, amount, category, frequency, description, date },
        { new: true, runValidators: true }
      );

      if (!scheduledCharge) {
        return res.status(404).json({ error: 'Scheduled charge not found' });
      }

      res.json(scheduledCharge);
    } else {
      const chargeIndex = scheduledCharges.findIndex(charge => charge._id === req.params.id);
      if (chargeIndex === -1) {
        return res.status(404).json({ error: 'Scheduled charge not found' });
      }
      
      scheduledCharges[chargeIndex] = {
        ...scheduledCharges[chargeIndex],
        title,
        amount: parseFloat(amount),
        category,
        frequency,
        description: description || '',
        date: date || scheduledCharges[chargeIndex].date
      };
      
      res.json(scheduledCharges[chargeIndex]);
    }
  } catch (error) {
    console.error('Error updating scheduled charge:', error);
    
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ error: errors.join(', ') });
    }
    
    res.status(500).json({ error: 'Failed to update scheduled charge' });
  }
});

// DELETE /api/scheduled/:id - Delete scheduled charge
router.delete('/:id', async (req, res) => {
  try {
    const ScheduledCharge = await getScheduledChargeModel;
    
    if (ScheduledCharge) {
      const scheduledCharge = await ScheduledCharge.findByIdAndDelete(req.params.id);
      if (!scheduledCharge) {
        return res.status(404).json({ error: 'Scheduled charge not found' });
      }
    } else {
      const chargeIndex = scheduledCharges.findIndex(charge => charge._id === req.params.id);
      if (chargeIndex === -1) {
        return res.status(404).json({ error: 'Scheduled charge not found' });
      }
      scheduledCharges.splice(chargeIndex, 1);
    }
    res.json({ message: 'Scheduled charge deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled charge:', error);
    res.status(500).json({ error: 'Failed to delete scheduled charge' });
  }
});

export default router;