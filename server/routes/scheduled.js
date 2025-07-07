import express from 'express';

const router = express.Router();

// In-memory storage when MongoDB is not available
let scheduledCharges = [];
let nextId = 1;

// GET all scheduled charges
router.get('/', async (req, res) => {
  try {
    // Try to use MongoDB model if available
    try {
      const ScheduledCharge = (await import('../models/ScheduledCharge.js')).default;
      const charges = await ScheduledCharge.find().sort({ nextDue: 1 });
      res.json(charges);
    } catch (error) {
      // Fall back to in-memory storage
      res.json(scheduledCharges);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST new scheduled charge
router.post('/', async (req, res) => {
  try {
    const { description, amount, frequency, nextDue, category } = req.body;
    
    // Try to use MongoDB model if available
    try {
      const ScheduledCharge = (await import('../models/ScheduledCharge.js')).default;
      const charge = new ScheduledCharge({ description, amount, frequency, nextDue, category });
      const savedCharge = await charge.save();
      res.status(201).json(savedCharge);
    } catch (error) {
      // Fall back to in-memory storage
      const charge = {
        id: nextId++,
        description,
        amount: parseFloat(amount),
        frequency,
        nextDue: new Date(nextDue),
        category,
        isActive: true
      };
      scheduledCharges.push(charge);
      res.status(201).json(charge);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE scheduled charge
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try to use MongoDB model if available
    try {
      const ScheduledCharge = (await import('../models/ScheduledCharge.js')).default;
      await ScheduledCharge.findByIdAndDelete(id);
      res.json({ message: 'Scheduled charge deleted' });
    } catch (error) {
      // Fall back to in-memory storage
      scheduledCharges = scheduledCharges.filter(charge => charge.id !== parseInt(id));
      res.json({ message: 'Scheduled charge deleted' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;