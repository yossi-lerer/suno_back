const express = require('express');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const jwt = require('jsonwebtoken');
dotenv.config();
const app = express();

const port = process.env.PORT || 4000;
const host = process.env.HOST || '0.0.0.0'; // הגדרת כתובת ברירת מחדל אם אינה מוגדרת ב-.env
const apiKey = process.env.API_KEY;

const users = [
  {
    username: process.env.USER_NAME,
    password: process.env.PASSWORD,
  }
];
const JWT_SECRET = 'your_secret_key';

app.use(cookieParser());
app.use(express.json()); // הוסף את ה-JSON Parser

// Middleware to check API key
const checkApiKey = (req, res, next) => {
  const requestApiKey = req.headers['x-api-key'];
  if (!requestApiKey || requestApiKey !== apiKey) {
    return res.status(403).json({ error: 'Forbidden: Invalid API Key' });
  }
  next();
};

app.post('/login', (req, res) => {
  const username = req.body.username;
  const password = req.body.password;
  const user = users.find(u => u.username === username && u.password === password);
  if (user) {
    const token = jwt.sign({ username: user.username }, JWT_SECRET); // הסרת role שאינו מוגדר ב-user
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid username or password' });
  }
});

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
app.post('/send-cookie', authenticateToken, (req, res) => {
  const { cookie } = req.body;
  console.log(cookie);
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

// Default route
app.get('/', authenticateToken, (req, res) => {
  res.send('SunoApi Cookie Provider');
});

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

// Start the server
app.listen(port, host, () => {
  console.log(`Server is running on http://${host}:${port}`);
});
