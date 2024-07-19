exports.generateUniqueIdentifier = () => {
  const min = 100000; // Smallest 6-digit number
  const max = 999999; // Largest 6-digit number

  // Generate a random integer between min and max (inclusive)
  const randomIdentifier = Math.floor(Math.random() * (max - min + 1)) + min;

  return String(randomIdentifier); // Convert it to a string
};

exports.isValidDate = (dateString) => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};
