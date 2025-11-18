const parseDob = (dobString) => {
  if (!dobString) {
    return null;
  }

  const parts = String(dobString).split('-');
  if (parts.length !== 3) {
    throw new Error('DOB must be in dd-mm-yyyy format');
  }

  const [dayStr, monthStr, yearStr] = parts;
  const day = Number(dayStr);
  const month = Number(monthStr) - 1;
  const year = Number(yearStr);

  if (
    Number.isNaN(day) ||
    Number.isNaN(month) ||
    Number.isNaN(year) ||
    day < 1 ||
    day > 31 ||
    month < 0 ||
    month > 11 ||
    year < 1900
  ) {
    throw new Error('Invalid DOB components');
  }

  const date = new Date(Date.UTC(year, month, day));

  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid DOB value');
  }

  return date;
};

const calculateAge = (dateOfBirth) => {
  if (!dateOfBirth) {
    return undefined;
  }

  const now = new Date();
  const dob = new Date(dateOfBirth);
  let age = now.getUTCFullYear() - dob.getUTCFullYear();

  const monthDiff = now.getUTCMonth() - dob.getUTCMonth();
  if (
    monthDiff < 0 ||
    (monthDiff === 0 && now.getUTCDate() < dob.getUTCDate())
  ) {
    age -= 1;
  }

  return age >= 0 ? age : undefined;
};

module.exports = {
  parseDob,
  calculateAge,
};

