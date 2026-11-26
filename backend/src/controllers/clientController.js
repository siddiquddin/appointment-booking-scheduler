import { Client } from '../models/Client.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const getClients = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const filter = {};

  if (search && search.trim()) {
    const regex = new RegExp(escapeRegex(search.trim()), 'i');
    filter.$or = [{ fullName: regex }, { email: regex }, { phone: regex }];
  }

  const clients = await Client.find(filter).sort({ createdAt: -1 });
  res.json({ success: true, count: clients.length, data: clients });
});

export const getClientById = asyncHandler(async (req, res, next) => {
  const client = await Client.findById(req.params.id);
  if (!client) {
    return next(new AppError('Client not found', 404));
  }
  return res.json({ success: true, data: client });
});

export const createClient = asyncHandler(async (req, res) => {
  const { fullName, email, phone, notes } = req.body;
  const client = await Client.create({
    fullName: fullName.trim(),
    email: email.trim().toLowerCase(),
    phone: phone.trim(),
    notes: notes ? notes.trim() : ''
  });
  res.status(201).json({ success: true, data: client });
});

export const updateClient = asyncHandler(async (req, res, next) => {
  const updates = {};
  if (req.body.fullName !== undefined) updates.fullName = req.body.fullName.trim();
  if (req.body.email !== undefined) updates.email = req.body.email.trim().toLowerCase();
  if (req.body.phone !== undefined) updates.phone = req.body.phone.trim();
  if (req.body.notes !== undefined) updates.notes = req.body.notes.trim();

  const client = await Client.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!client) {
    return next(new AppError('Client not found', 404));
  }
  return res.json({ success: true, data: client });
});

export const deleteClient = asyncHandler(async (req, res, next) => {
  const client = await Client.findByIdAndDelete(req.params.id);
  if (!client) {
    return next(new AppError('Client not found', 404));
  }
  return res.json({ success: true, message: 'Client deleted successfully', data: client });
});
