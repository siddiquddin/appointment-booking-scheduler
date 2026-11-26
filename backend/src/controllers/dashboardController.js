import { Appointment } from '../models/Appointment.js';
import { Client } from '../models/Client.js';
import { asyncHandler } from '../middleware/errorHandler.js';

export const getDashboardStats = asyncHandler(async (_req, res) => {
  const now = new Date();
  const startOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const endOfToday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));

  const [
    todaysCount,
    scheduledCount,
    completedCount,
    cancelledCount,
    totalClients,
    revenueAppointments,
    todaysSchedule
  ] = await Promise.all([
    Appointment.countDocuments({ appointmentDate: { $gte: startOfToday, $lte: endOfToday } }),
    Appointment.countDocuments({ status: 'Scheduled' }),
    Appointment.countDocuments({ status: 'Completed' }),
    Appointment.countDocuments({ status: 'Cancelled' }),
    Client.countDocuments(),
    Appointment.find({ status: { $in: ['Scheduled', 'Completed'] } }).populate('service', 'price'),
    Appointment.find({ appointmentDate: { $gte: startOfToday, $lte: endOfToday } })
      .populate('client', 'fullName email phone')
      .populate('service', 'name category durationMinutes price')
      .sort({ appointmentDate: 1 })
  ]);

  const estimatedRevenue = revenueAppointments.reduce((sum, appt) => {
    return sum + (appt.service?.price || 0);
  }, 0);

  res.json({
    success: true,
    data: {
      todaysAppointments: todaysCount,
      scheduled: scheduledCount,
      completed: completedCount,
      cancelled: cancelledCount,
      totalClients,
      estimatedRevenue,
      todaysSchedule
    }
  });
});
