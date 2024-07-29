const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = process.env.PORT || 4000;
const host = process.env.HOST

app.use(cookieParser());
app.use(express.json());

// Function to write the cookie to the .env file
const writeCookieToEnv = (cookie) => {
  const envPath = path.resolve(__dirname, '.env');
  
  // Read existing .env file
  let envVars = {};
  if (fs.existsSync(envPath)) {
    envVars = dotenv.parse(fs.readFileSync(envPath));
  }

  // Add or update the cookie in the .env file
  envVars['SUNO_COOKIE'] = `"${cookie}"`; // Ensure the value is stored as a string

  // Write the updated environment variables back to the .env file
  const newEnvVars = Object.keys(envVars)
    .map(key => `${key}=${envVars[key]}`)
    .join('\n');

  fs.writeFileSync(envPath, newEnvVars);
}

// Route to receive the cookie and save it to the .env file
app.post('/send-cookie', (req, res) => {
  const { cookie } = req.body;
console.log(cookie)
  if (!cookie) {
    return res.status(400).json({ error: 'Cookie is required' });
  }

  // Save the cookie to the .env file
  try {
    writeCookieToEnv(cookie);
    res.json({ message: 'Cookie received and stored successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to store cookie' });
  }
});

// Route to get the cookie from the .env file
app.get('/get-cookie', (req, res) => {
  const sunoCookie = process.env.SUNO_COOKIE;

  if (!sunoCookie) {
    return res.status(500).json({ error: 'Suno cookie not found' });
  }

  res.json({ cookie: sunoCookie });
});

// Default route
app.get('/', (req, res) => {
  res.send('SunoApi Cookie Provider');
});

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});