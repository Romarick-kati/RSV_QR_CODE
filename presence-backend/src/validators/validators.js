import { ApiError } from '../utils/ApiError.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validate(body, rules) {
  const errors = {};
  for (const [field, rule] of Object.entries(rules)) {
    const value = body[field];
    if (rule.required && (value === undefined || value === null || value === '')) {
      errors[field] = `${rule.label || field} is required.`;
      continue;
    }
    if (value === undefined || value === null || value === '') continue;
    if (rule.type === 'email' && !EMAIL_RE.test(value)) {
      errors[field] = 'Enter a valid email address.';
    }
    if (rule.minLength && String(value).length < rule.minLength) {
      errors[field] = `${rule.label || field} must be at least ${rule.minLength} characters.`;
    }
    if (rule.min !== undefined && Number(value) < rule.min) {
      errors[field] = `${rule.label || field} must be at least ${rule.min}.`;
    }
    if (rule.oneOf && !rule.oneOf.includes(value)) {
      errors[field] = `${rule.label || field} must be one of: ${rule.oneOf.join(', ')}.`;
    }
  }
  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Validation failed.', errors);
  }
}

export const authValidators = {
  register: (body) => validate(body, {
    name: { required: true, label: 'Name' },
    email: { required: true, type: 'email', label: 'Email' },
    password: { required: true, minLength: 6, label: 'Password' },
  }),
  login: (body) => validate(body, {
    email: { required: true, type: 'email', label: 'Email' },
    password: { required: true, label: 'Password' },
  }),
};

export const eventValidators = {
  upsert: (body) => validate(body, {
    title: { required: true, label: 'Title' },
    description: { required: true, label: 'Description' },
    category: { required: true, label: 'Category' },
    date: { required: true, label: 'Date' },
    startTime: { required: true, label: 'Start time' },
    endTime: { required: true, label: 'End time' },
    venue: { required: true, label: 'Venue' },
    capacity: { required: true, min: 1, label: 'Capacity' },
    registrationDeadline: { required: true, label: 'Registration deadline' },
    status: { oneOf: ['draft', 'published', 'cancelled', 'completed'], label: 'Status' },
  }),
};

export const adminValidators = {
  createUser: (body) => validate(body, {
    name: { required: true, label: 'Name' },
    email: { required: true, type: 'email', label: 'Email' },
    password: { required: true, minLength: 6, label: 'Password' },
    role: { oneOf: ['ADMIN', 'ORGANIZER', 'ATTENDEE'], label: 'Role' },
  }),
  updateUser: (body) => validate(body, {
    name: { label: 'Name' },
    email: { type: 'email', label: 'Email' },
    password: { minLength: 6, label: 'Password' },
    role: { oneOf: ['ADMIN', 'ORGANIZER', 'ATTENDEE'], label: 'Role' },
  }),
};
