export const validateMobile = (value) => {
  if (value.length !== 10) return 'Mobile number must be exactly 10 digits!';
  return '';
};

export const validateTelephone = (value) => {
  if (value.length !== 7) return 'Telephone number must be exactly 7 digits!';
  return '';
};

export const validateAge = (value) => {
  if (value.length < 1) return 'Please add proper age!';
  return '';
};

export const validatePinCode = (value) => {
  if (value.length !== 6) return 'Pin code must be exactly 6 digits!';
  return '';
};

export const validateEmail = (value) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(value)) return 'Invalid email format!';
  return '';
};
