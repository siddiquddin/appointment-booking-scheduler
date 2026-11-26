import { Service } from '../models/Service.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const getServices = asyncHandler(async (req, res) => {
  const { activeOnly, category } = req.query;
  const filter = {};

  if (activeOnly === 'true') {
    filter.isActive = true;
  }
  if (category && category !== 'All') {
    filter.category = category;
  }

  const services = await Service.find(filter).sort({ category: 1, name: 1 });
  res.json({ success: true, count: services.length, data: services });
});

export const getServiceById = asyncHandler(async (req, res, next) => {
  const service = await Service.findById(req.params.id);
  if (!service) {
    return next(new AppError('Service not found', 404));
  }
  return res.json({ success: true, data: service });
});

export const createService = asyncHandler(async (req, res) => {
  const { name, category, durationMinutes, price, isActive } = req.body;
  const service = await Service.create({
    name: name.trim(),
    category: category.trim(),
    durationMinutes: Number(durationMinutes),
    price: Number(price),
    isActive: isActive !== undefined ? Boolean(isActive) : true
  });
  res.status(201).json({ success: true, data: service });
});

export const updateService = asyncHandler(async (req, res, next) => {
  const updates = {};
  if (req.body.name !== undefined) updates.name = req.body.name.trim();
  if (req.body.category !== undefined) updates.category = req.body.category.trim();
  if (req.body.durationMinutes !== undefined) updates.durationMinutes = Number(req.body.durationMinutes);
  if (req.body.price !== undefined) updates.price = Number(req.body.price);
  if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

  const service = await Service.findByIdAndUpdate(req.params.id, updates, {
    new: true,
    runValidators: true
  });

  if (!service) {
    return next(new AppError('Service not found', 404));
  }
  return res.json({ success: true, data: service });
});

export const deleteService = asyncHandler(async (req, res, next) => {
  const service = await Service.findByIdAndDelete(req.params.id);
  if (!service) {
    return next(new AppError('Service not found', 404));
  }
  return res.json({ success: true, message: 'Service deleted successfully', data: service });
});
