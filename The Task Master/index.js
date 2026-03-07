import express from "express";
import pool from "./db.js";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import authenticateToken from './authMiddleware.js';
import dotenv from 'dotenv';

const app = express();
dotenv.config();

app.use(express.json());
// Error handling middleware

app.use((err, req, res, next) => {
    console.error(err.stack);

    res.status(500).json({
        error: "Server mein kuch gadbad hai!",
        message: err.message
    });
});

app.get('/', (req, res) => {
    console.log(req.ip);
    return res.status(200).send('Server is live');
});

app.post('/add-task', (req, res) => {
    const taskdata = req.body;

    console.log('Data', taskdata);

    return res.status(200).send('Data Saved successfully!');
});


app.post('/sign-up', async (req, res) => {
    console.log(req.body);
    const { name, email, password } = req.body;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    if (!name || !email || !password) {
        return res.status(400).json({ error: "Please add right User details." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ error: "Email is not in the right format." });
    }

    const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userCheck.rows.length > 0) {
        return res.status(400).json({
            error: "Bhai, ye email already registered hai. Login karle!"
        });
    }

    try {
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING *',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        return res.status(201).json({
            message: "Mubarak ho! Account ban gaya.",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });;
    } catch (err) {
        console.error(err);
        return res.status(500).send("DB Error ho gaya!");
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

        if (userResult.rows.length === 0) {
            return res.status(401).json({ error: "Email ya Password galat hai, bhai!" });
        }

        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ error: "Email ya Password galat hai, bhai!" });
        }

        const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).json({
            message: "Welcome back! Login successful.",
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server ki halat kharab hai (Server Error)");
    }
});

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

app.listen(process.env.PORT, () => {
    console.log(`Listening to the port ${process.env.PORT}`);
})