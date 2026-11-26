import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: [120, 'Full name cannot exceed 120 characters']
    },
    email: {
      type: String,
      required: [true, 'Email address is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      maxlength: [32, 'Phone number cannot exceed 32 characters']
    },
    notes: {
      type: String,
      trim: true,
      default: '',
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

clientSchema.index({ fullName: 1, phone: 1 });

export const Client = mongoose.model('Client', clientSchema);
