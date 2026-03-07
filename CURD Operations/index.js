

import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';

const app = express();
const PORT = 3000;

// Middleware to parse JSON (Zaroori hai!)
// global way.
app.use(express.json());

const SECRET_KEY = "aapka_super_secret_code_yahan";
const DATA_FILE = './users.json';


function loadData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch(error) {
        return [];
    }
}

const saveData = (data) => {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2)); 
};

const requestLogs = {};

// Middleware
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: "Token missing!" });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    
    req.user = decoded; 
    
    next(); 
  } catch (error) {
    return res.status(403).json({ message: "Invalid or Expired Token!" });
  }
};

const rateLimiter = (req, res, next) => {
  const ip = req.ip;
  const limit = 5;
  const windowMs = 60 * 1000;
  const currentTime = Date.now();

  if (!requestLogs[ip]) {
    requestLogs[ip] = [];
  }

    while (requestLogs[ip].length > 0 && currentTime - requestLogs[ip][0] > windowMs) {
        requestLogs[ip].shift();
    }

  if (requestLogs[ip].length < limit) {
    requestLogs[ip].push(currentTime);
    next();
  } else {
    res.status(429).json({ 
      message: "Bahut tez chal rahe ho! Thoda ruk jao. 🚦",
      retryAfter: "Kuch der baad try karein"
    });
  }
}


app.get('/users', (req, res) => {
    const currentUsers = loadData();
  res.json(currentUsers);
});

app.post('/login', (req, res) => {
  const { username } = req.body;

  if (!username) {
    return res.status(400).json({ message: "Username toh bhejo bhai!" });
  }

  const token = jwt.sign(
    { name: username, role: "admin" },
    SECRET_KEY,
    { expiresIn: '1h' }
  );

  res.json({ token });
});

app.post('/users', [rateLimiter, authMiddleware], (req, res) => {
    const currentUsers = loadData();

    const lastId = currentUsers.length > 0 ? currentUsers[currentUsers.length - 1].id : 0;

  const newUser = {
    id: lastId + 1,
    name: req.body.name,
    role: req.body.role
  };

  currentUsers.push(newUser);
  saveData(currentUsers);

  res.status(201).json(newUser);
});

app.patch('/users/:id', authMiddleware, (req, res) => {
  const currentUsers = loadData();
  const userId = parseInt(req.params.id);
  const user = currentUsers.find(u => u.id === userId);

  if (user) {
    user.name = req.body.name || user.name;
    user.role = req.body.role || user.role;
    saveData(currentUsers);
    res.json({ message: "Update ho gaya! ✅", user });
  } else {
    res.status(404).json({ message: "User gayab hai! 👻" });
  }
});


app.delete('/delete/:id', [rateLimiter, authMiddleware], (req, res) => {
    const currentUsers = loadData();
    const userId = parseInt(req.params.id);
    const index = currentUsers.findIndex(u => u.id === userId);

    if (index !== -1) {
    currentUsers.splice(index, 1);
    saveData(currentUsers);
    res.json({ message: `User ${userId} deleted successfully! 🗑️` });
  } else {
    res.status(404).json({ message: "User nahi mila, kise udaun? 🤷‍♂️" });
  }
});

app.get('/', (req, res) => {
  res.send('Server Started');
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});