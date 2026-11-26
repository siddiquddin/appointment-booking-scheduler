import { Appointment } from '../models/Appointment.js';
import { Client } from '../models/Client.js';
import { Service } from '../models/Service.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

/**
 * Checks whether an active ('Scheduled') appointment for the same staff member
 * overlaps the requested [newStart, newEnd) interval.
 * Overlap condition: existingStart < newEnd && existingEnd > newStart.
 */
async function checkStaffOverlap({ staffName, start, end, excludeId = null }) {
  const query = {
    staffName,
    status: 'Scheduled',
    appointmentDate: { $lt: end },
    endTime: { $gt: start }
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return Appointment.findOne(query).populate('client', 'fullName').populate('service', 'name');
}

export const getAppointments = asyncHandler(async (req, res) => {
  const { date, status, staffName, clientId } = req.query;
  const filter = {};

  if (status && status !== 'All') {
    filter.status = status;
  }
  if (staffName && staffName !== 'All') {
    filter.staffName = staffName;
  }
  if (clientId) {
    filter.client = clientId;
  }
  if (date) {
    const startOfDay = new Date(`${date}T00:00:00.000Z`);
    const endOfDay = new Date(`${date}T23:59:59.999Z`);
    if (!Number.isNaN(startOfDay.getTime())) {
      filter.appointmentDate = { $gte: startOfDay, $lte: endOfDay };
    }
  }

  const appointments = await Appointment.find(filter)
    .populate('client', 'fullName email phone')
    .populate('service', 'name category durationMinutes price')
    .sort({ appointmentDate: 1 });

  res.json({ success: true, count: appointments.length, data: appointments });
});

export const getAppointmentById = asyncHandler(async (req, res, next) => {
  const appointment = await Appointment.findById(req.params.id)
    .populate('client', 'fullName email phone notes')
    .populate('service', 'name category durationMinutes price');

  if (!appointment) {
    return next(new AppError('Appointment not found', 404));
  }
  return res.json({ success: true, data: appointment });
});

export const createAppointment = asyncHandler(async (req, res, next) => {
  const { client: clientId, clientInfo, service: serviceId, staffName, appointmentDate, status, notes } = req.body;

  // Verify service exists
  const serviceDoc = await Service.findById(serviceId);
  if (!serviceDoc) {
    return next(new AppError('Selected service not found', 404));
  }

  // Resolve client ID or upsert from public self-booking details
  let resolvedClientId = clientId;
  if (!resolvedClientId && clientInfo) {
    const normalizedEmail = clientInfo.email.trim().toLowerCase();
    let existingClient = await Client.findOne({ email: normalizedEmail });
    if (!existingClient) {
      existingClient = await Client.create({
        fullName: clientInfo.fullName.trim(),
        email: normalizedEmail,
        phone: clientInfo.phone.trim(),
        notes: 'Created via online booking'
      });
    } else if (clientInfo.fullName || clientInfo.phone) {
      existingClient.fullName = clientInfo.fullName.trim();
      existingClient.phone = clientInfo.phone.trim();
      await existingClient.save();
    }
    resolvedClientId = existingClient._id;
  } else {
    const clientExists = await Client.exists({ _id: resolvedClientId });
    if (!clientExists) {
      return next(new AppError('Selected client not found', 404));
    }
  }

  const start = new Date(appointmentDate);
  const end = new Date(start.getTime() + serviceDoc.durationMinutes * 60000);
  const resolvedStaff = (staffName && staffName.trim()) || 'General Staff';
  const resolvedStatus = status || 'Scheduled';

  // Enforce double-booking conflict check when creating a Scheduled appointment
  if (resolvedStatus === 'Scheduled') {
    const conflict = await checkStaffOverlap({
      staffName: resolvedStaff,
      start,
      end
    });
    if (conflict) {
      return next(
        new AppError(
          `Double-booking conflict: ${resolvedStaff} already has an overlapping appointment (${conflict.service?.name || 'Session'}) from ${conflict.appointmentDate.toISOString()} to ${conflict.endTime.toISOString()}`,
          409
        )
      );
    }
  }

  const created = await Appointment.create({
    client: resolvedClientId,
    service: serviceDoc._id,
    staffName: resolvedStaff,
    appointmentDate: start,
    endTime: end,
    status: resolvedStatus,
    notes: notes ? notes.trim() : ''
  });

  const populated = await Appointment.findById(created._id)
    .populate('client', 'fullName email phone')
    .populate('service', 'name category durationMinutes price');

  return res.status(201).json({ success: true, data: populated });
});

export const updateAppointment = asyncHandler(async (req, res, next) => {
  const existing = await Appointment.findById(req.params.id);
  if (!existing) {
    return next(new AppError('Appointment not found', 404));
  }

  const nextClientId = req.body.client !== undefined ? req.body.client : existing.client;
  const nextServiceId = req.body.service !== undefined ? req.body.service : existing.service;
  const nextStaffName =
    req.body.staffName !== undefined && req.body.staffName.trim()
      ? req.body.staffName.trim()
      : existing.staffName;
  const nextStart =
    req.body.appointmentDate !== undefined ? new Date(req.body.appointmentDate) : existing.appointmentDate;
  const nextStatus = req.body.status !== undefined ? req.body.status : existing.status;
  const nextNotes = req.body.notes !== undefined ? req.body.notes.trim() : existing.notes;

  const clientExists = await Client.exists({ _id: nextClientId });
  if (!clientExists) {
    return next(new AppError('Selected client not found', 404));
  }

  const serviceDoc = await Service.findById(nextServiceId);
  if (!serviceDoc) {
    return next(new AppError('Selected service not found', 404));
  }

  const nextEnd = new Date(nextStart.getTime() + serviceDoc.durationMinutes * 60000);

  if (nextStatus === 'Scheduled') {
    const conflict = await checkStaffOverlap({
      staffName: nextStaffName,
      start: nextStart,
      end: nextEnd,
      excludeId: existing._id
    });
    if (conflict) {
      return next(
        new AppError(
          `Double-booking conflict: ${nextStaffName} already has an overlapping appointment from ${conflict.appointmentDate.toISOString()} to ${conflict.endTime.toISOString()}`,
          409
        )
      );
    }
  }

  existing.client = nextClientId;
  existing.service = serviceDoc._id;
  existing.staffName = nextStaffName;
  existing.appointmentDate = nextStart;
  existing.endTime = nextEnd;
  existing.status = nextStatus;
  existing.notes = nextNotes;

  await existing.save();

  const populated = await Appointment.findById(existing._id)
    .populate('client', 'fullName email phone')
    .populate('service', 'name category durationMinutes price');

  return res.json({ success: true, data: populated });
});

export const updateAppointmentStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body;
  const existing = await Appointment.findById(req.params.id);
  if (!existing) {
    return next(new AppError('Appointment not found', 404));
  }

  // Re-activating an appointment back to Scheduled must re-verify overlap
  if (status === 'Scheduled' && existing.status !== 'Scheduled') {
    const conflict = await checkStaffOverlap({
      staffName: existing.staffName,
      start: existing.appointmentDate,
      end: existing.endTime,
      excludeId: existing._id
    });
    if (conflict) {
      return next(
        new AppError(
          `Cannot re-schedule: ${existing.staffName} already has an overlapping active appointment`,
          409
        )
      );
    }
  }

  existing.status = status;
  await existing.save();

  const populated = await Appointment.findById(existing._id)
    .populate('client', 'fullName email phone')
    .populate('service', 'name category durationMinutes price');

  return res.json({ success: true, data: populated });
});

export const deleteAppointment = asyncHandler(async (req, res, next) => {
  const deleted = await Appointment.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(new AppError('Appointment not found', 404));
  }
  return res.json({ success: true, message: 'Appointment deleted successfully', data: deleted });
});
