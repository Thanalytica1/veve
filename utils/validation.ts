export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const normalizePhone = (phone: string): string => {
  return phone.replace(/\D/g, '');
};

export const validatePhone = (phone: string): boolean => {
  const normalized = normalizePhone(phone);
  return normalized.length >= 10 && normalized.length <= 15;
};

export const formatPhone = (phone: string): string => {
  const normalized = normalizePhone(phone);
  if (normalized.length === 10) {
    return `(${normalized.slice(0, 3)}) ${normalized.slice(3, 6)}-${normalized.slice(6)}`;
  } else if (normalized.length === 11 && normalized[0] === '1') {
    return `+1 (${normalized.slice(1, 4)}) ${normalized.slice(4, 7)}-${normalized.slice(7)}`;
  }
  return phone;
};

export const validateTag = (tag: string): boolean => {
  return tag.length >= 2 && tag.length <= 24;
};

export interface ValidationErrors {
  [key: string]: string | undefined;
}

export const validateClientForm = (data: any): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (!data.displayName && (!data.firstName || !data.lastName)) {
    errors.name = 'Either display name or first and last name are required';
  }

  if (data.email && !validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (data.phone && !validatePhone(data.phone)) {
    errors.phone = 'Phone number must be 10-15 digits';
  }

  if (data.totalSessions !== undefined && data.totalSessions < 0) {
    errors.totalSessions = 'Total sessions must be 0 or greater';
  }

  if (data.sessionsRemaining !== undefined) {
    if (data.sessionsRemaining < 0) {
      errors.sessionsRemaining = 'Sessions remaining cannot be negative';
    } else if (data.totalSessions !== undefined && data.sessionsRemaining > data.totalSessions) {
      errors.sessionsRemaining = 'Sessions remaining cannot exceed total sessions';
    }
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.endDate = 'End date must be after start date';
    }
  }

  if (data.tags && Array.isArray(data.tags)) {
    if (data.tags.length > 10) {
      errors.tags = 'Maximum 10 tags allowed';
    } else {
      const invalidTag = data.tags.find((tag: string) => !validateTag(tag));
      if (invalidTag) {
        errors.tags = 'Each tag must be 2-24 characters';
      }
    }
  }

  return errors;
};