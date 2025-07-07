import mongoose from 'mongoose';

const scheduledChargeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [100, 'Title cannot be more than 100 characters']
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0.01, 'Amount must be greater than 0']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['Food', 'Transportation', 'Entertainment', 'Shopping', 'Bills', 'Healthcare', 'Education', 'Travel', 'Other'],
    trim: true
  },
  frequency: {
    type: String,
    required: [true, 'Frequency is required'],
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot be more than 500 characters']
  },
  date: {
    type: Date,
    required: [true, 'Date is required'],
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
scheduledChargeSchema.index({ date: -1 });
scheduledChargeSchema.index({ category: 1 });
scheduledChargeSchema.index({ frequency: 1 });

const ScheduledCharge = mongoose.model('ScheduledCharge', scheduledChargeSchema);

export default ScheduledCharge;