import express from 'express';
import ScheduledCharge from '../models/ScheduledCharge.js';

const router = express.Router();

// GET /api/scheduled - Get all scheduled charges
router.get('/', async (req, res) => {
  try {
    const { category, frequency } = req.query;
    const filters = { isActive: true };
    
    if (category && category !== 'All') {
      filters.category = category;
    }
    
    if (frequency) {
      filters.frequency = frequency;
    }

    const scheduledCharges = await ScheduledCharge.find(filters).sort({ date: -1 });
    res.json(scheduledCharges);
  } catch (error) {
    console.error('Error fetching scheduled charges:', error);
    res.status(500).json({ error: 'Failed to fetch scheduled charges' });
  }
});

// POST /api/scheduled - Create new scheduled charge
router.post('/', async (req, res) => {
  try {
    const { title, amount, category, frequency, description, date } = req.body;

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

    const scheduledCharge = await ScheduledCharge.findByIdAndUpdate(
      req.params.id,
      { title, amount, category, frequency, description, date },
      { new: true, runValidators: true }
    );

    if (!scheduledCharge) {
      return res.status(404).json({ error: 'Scheduled charge not found' });
    }

    res.json(scheduledCharge);
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
    const scheduledCharge = await ScheduledCharge.findByIdAndDelete(req.params.id);
    if (!scheduledCharge) {
      return res.status(404).json({ error: 'Scheduled charge not found' });
    }
    res.json({ message: 'Scheduled charge deleted successfully' });
  } catch (error) {
    console.error('Error deleting scheduled charge:', error);
    res.status(500).json({ error: 'Failed to delete scheduled charge' });
  }
});

export default router;