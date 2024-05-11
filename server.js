const express = require('express');
const axios = require('axios');
const app = express();

// Configuration
const WINDOW_SIZE = 10;
const TEST_SERVER_BASE_URL = 'http://20.244.56.144/test/';

// Global variables
let storedNumbers = [];

const fetchNumbers = async (numberType) => {
  try {
    const response = await axios.get(TEST_SERVER_BASE_URL + numberType);
    return response.data.numbers || [];
  } catch (error) {
    console.error('Error fetching numbers:', error.message);
    return [];
  }
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
};

const updateWindow = (newNumbers) => {
  storedNumbers = [...new Set([...storedNumbers, ...newNumbers])];
  if (storedNumbers.length > WINDOW_SIZE) {
    storedNumbers = storedNumbers.slice(-WINDOW_SIZE);
  }
};

app.get('/numbers/:numberType', async (req, res) => {
  const start = process.hrtime();

  const numberType = req.params.numberType;
  const numbersFromServer = await fetchNumbers(numberType);
  const updatedNumbers = [...new Set(numbersFromServer.filter(num => !storedNumbers.includes(num)))];
  updateWindow(updatedNumbers);

  const currentWindow = storedNumbers.slice(-WINDOW_SIZE);
  const avg = calculateAverage(currentWindow);

  const response = {
    windowPrevState: storedNumbers.slice(0, -updatedNumbers.length),
    windowCurrState: currentWindow,
    numbers: numbersFromServer,
    avg: avg.toFixed(2)
  };

  const elapsed = process.hrtime(start)[1] / 1000000; // convert to milliseconds
  if (elapsed > 500) {
    return res.status(500).send('Internal Server Error: Response time exceeded');
  }

  res.json(response);
});

const PORT = 9876;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});