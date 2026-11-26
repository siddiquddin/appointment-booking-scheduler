import mongoose from 'mongoose';

const serviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Service name is required'],
      trim: true,
      maxlength: [120, 'Service name cannot exceed 120 characters']
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      trim: true,
      maxlength: [80, 'Category cannot exceed 80 characters']
    },
    durationMinutes: {
      type: Number,
      required: [true, 'Duration in minutes is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [480, 'Duration cannot exceed 480 minutes']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative']
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

serviceSchema.index({ category: 1, isActive: 1 });

export const Service = mongoose.model('Service', serviceSchema);
