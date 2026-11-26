import mongoose from 'mongoose';
import { AppError } from './errorHandler.js';
import { APPOINTMENT_STATUSES } from '../models/Appointment.js';

export function validateObjectId(paramName = 'id') {
  return (req, _res, next) => {
    const val = req.params[paramName];
    if (!mongoose.Types.ObjectId.isValid(val)) {
      return next(new AppError(`Invalid ${paramName}: '${val}'`, 400));
    }
    return next();
  };
}

export function validateServicePayload(isUpdate = false) {
  return (req, _res, next) => {
    const { name, category, durationMinutes, price, isActive } = req.body;
    const errors = [];

    if (!isUpdate || name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        errors.push('Service name must be a non-empty string');
      }
    }
    if (!isUpdate || category !== undefined) {
      if (typeof category !== 'string' || !category.trim()) {
        errors.push('Service category must be a non-empty string');
      }
    }
    if (!isUpdate || durationMinutes !== undefined) {
      const dur = Number(durationMinutes);
      if (!Number.isFinite(dur) || dur < 5 || dur > 480) {
        errors.push('durationMinutes must be a number between 5 and 480');
      }
    }
    if (!isUpdate || price !== undefined) {
      const p = Number(price);
      if (!Number.isFinite(p) || p < 0) {
        errors.push('price must be a non-negative number');
      }
    }
    if (isActive !== undefined && typeof isActive !== 'boolean') {
      errors.push('isActive must be a boolean');
    }

    if (errors.length) {
      return next(new AppError(errors[0], 400, errors));
    }
    return next();
  };
}

export function validateClientPayload(isUpdate = false) {
  return (req, _res, next) => {
    const { fullName, email, phone } = req.body;
    const errors = [];

    if (!isUpdate || fullName !== undefined) {
      if (typeof fullName !== 'string' || !fullName.trim()) {
        errors.push('fullName must be a non-empty string');
      }
    }
    if (!isUpdate || email !== undefined) {
      if (typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email.trim())) {
        errors.push('email must be a valid email address');
      }
    }
    if (!isUpdate || phone !== undefined) {
      if (typeof phone !== 'string' || !phone.trim()) {
        errors.push('phone must be a non-empty string');
      }
    }

    if (errors.length) {
      return next(new AppError(errors[0], 400, errors));
    }
    return next();
  };
}

export function validateAppointmentPayload(isUpdate = false) {
  return (req, _res, next) => {
    const { client, clientInfo, service, appointmentDate, status } = req.body;
    const errors = [];

    if (!isUpdate) {
      if (!client && !clientInfo) {
        errors.push('Either client ID or clientInfo { fullName, email, phone } is required');
      }
      if (client && !mongoose.Types.ObjectId.isValid(client)) {
        errors.push('client must be a valid ObjectId');
      }
      if (clientInfo) {
        if (!clientInfo.fullName?.trim()) errors.push('clientInfo.fullName is required');
        if (!clientInfo.email || !/^\S+@\S+\.\S+$/.test(clientInfo.email.trim())) {
          errors.push('clientInfo.email must be a valid email');
        }
        if (!clientInfo.phone?.trim()) errors.push('clientInfo.phone is required');
      }
    } else if (client !== undefined && !mongoose.Types.ObjectId.isValid(client)) {
      errors.push('client must be a valid ObjectId');
    }

    if (!isUpdate || service !== undefined) {
      if (!service || !mongoose.Types.ObjectId.isValid(service)) {
        errors.push('service must be a valid ObjectId');
      }
    }

    if (!isUpdate || appointmentDate !== undefined) {
      const parsed = new Date(appointmentDate);
      if (Number.isNaN(parsed.getTime())) {
        errors.push('appointmentDate must be a valid ISO date-time string');
      }
    }

    if (status !== undefined && !APPOINTMENT_STATUSES.includes(status)) {
      errors.push(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`);
    }

    if (errors.length) {
      return next(new AppError(errors[0], 400, errors));
    }
    return next();
  };
}

export function validateStatusPatch(req, _res, next) {
  const { status } = req.body;
  if (!status || !APPOINTMENT_STATUSES.includes(status)) {
    return next(
      new AppError(`status must be one of: ${APPOINTMENT_STATUSES.join(', ')}`, 400)
    );
  }
  return next();
}
