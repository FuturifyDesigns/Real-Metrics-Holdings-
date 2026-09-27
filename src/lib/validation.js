export const phoneValidationMessage = 'Enter a valid phone number using digits, spaces, brackets, + or -.';

export const isValidPhoneNumber = (value) => /^\+?[0-9][0-9 ()-]{5,18}$/.test(value.trim());

export const validatePhoneInput = (event) => {
  const input = event.currentTarget;
  input.setCustomValidity(!input.value || isValidPhoneNumber(input.value) ? '' : phoneValidationMessage);
};
