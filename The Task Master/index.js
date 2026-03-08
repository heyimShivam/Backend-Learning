import express from "express";
import path from "path";
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
import pool from "./db.js";
import authenticateToken from './authMiddleware.js';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes.js';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';

const app = express();

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Is folder mein file jayegi
    },
    filename: function (req, file, cb) {
        // Filename unique hona chahiye (Timestamp + Original Name)
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

app.use(cors(corsOptions));
app.use(cookieParser());
dotenv.config();

app.use('/uploads', express.static('uploads'));
app.use(express.static(path.join(__dirname, 'build')));
app.use(express.json());

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: "Server mein kuch gadbad hai!",
        message: err.message
    });
});

// app.get('/', (req, res) => {
//     return res.status(200).sendFile(path.join(__dirname, '/build/index.html'));
// });


app.use('', authRoutes);

app.patch('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;
    const userId = req.user.userId;

    try {
        const updatedTask = await pool.query(
            'UPDATE tasks SET is_completed = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
            [is_completed, id, userId]
        );

        if (updatedTask.rows.length === 0) {
            return res.status(404).json({ error: "Task nahi mila ya aapka nahi hai!" });
        }

        return res.json(updatedTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Update fail ho gaya!");
    }
});

app.delete('/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;

    try {
        const result = await pool.query(
            'DELETE FROM tasks WHERE id = $1 AND user_id = $2',
            [id, userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: "Task delete nahi hua (Mila nahi ya permission nahi hai)" });
        }

        res.json({ message: "Task delete ho gaya, khalaas!" });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Delete error!");
    }
});

app.get('/tasks', [authenticateToken], async (req, res) => {
    const userId = req.user.userId;
    try {
        const allTasks = await pool.query(
            'SELECT * FROM tasks WHERE user_id = $1 ORDER BY created_at DESC',
            [userId]
        );

        return res.status(200).json(allTasks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Tasks fetch karne mein error aa gaya!");
    }
});

app.post('/tasks', authenticateToken, async (req, res) => {
    const { title, description } = req.body;
    const userId = req.user.userId; // Middleware ne ye ID nikaal ke di hai

    try {
        const newTask = await pool.query(
            'INSERT INTO tasks (user_id, title, description) VALUES ($1, $2, $3) RETURNING *',
            [userId, title, description]
        );

        return res.status(201).json(newTask.rows[0]);
    } catch (err) {
        console.error(err.message);
        return res.status(500).send("Task create nahi ho paya!");
    }
});

app.get('/', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'));
});

app.get('/verify', authenticateToken, (req, res) => {
    res.status(200).json({
        loggedIn: true,
        user: req.user
    });
});

app.post('/logout', (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: false,
        sameSite: 'Lax'
    });
    return res.status(200).json({ message: "Logged out successfully!" });
});

app.post('/tasks/upload', upload.single('taskFile'), (req, res) => {
    console.log(req.file);
    res.json({ message: "File uploaded successfully!", path: req.file.path });
});

app.listen(process.env.PORT, () => {
    console.log(`Listening to the port ${process.env.PORT}`);
})