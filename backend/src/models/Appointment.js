import mongoose from 'mongoose';

export const APPOINTMENT_STATUSES = ['Scheduled', 'Completed', 'Cancelled', 'No-Show'];

const appointmentSchema = new mongoose.Schema(
  {
    client: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Client',
      required: [true, 'Client reference is required']
    },
    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: [true, 'Service reference is required']
    },
    staffName: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true,
      default: 'General Staff'
    },
    appointmentDate: {
      type: Date,
      required: [true, 'Appointment start date and time are required']
    },
    endTime: {
      type: Date,
      required: [true, 'Appointment end time is required']
    },
    status: {
      type: String,
      enum: {
        values: APPOINTMENT_STATUSES,
        message: 'Status must be Scheduled, Completed, Cancelled, or No-Show'
      },
      default: 'Scheduled'
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

// Compound indexes for double-booking checks, dashboard queries, and client history
appointmentSchema.index({ staffName: 1, appointmentDate: 1 });
appointmentSchema.index({ status: 1, appointmentDate: 1 });
appointmentSchema.index({ client: 1, appointmentDate: -1 });

export const Appointment = mongoose.model('Appointment', appointmentSchema);
