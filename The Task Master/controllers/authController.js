import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import dotenv from 'dotenv';

dotenv.config();

const cookieOptions = {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    maxAge: 24 * 60 * 60 * 1000
};

export const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // 1. INPUT VALIDATION (Pehle check karo data kachra toh nahi)
        if (!name || !email || !password) {
            return res.status(400).json({ error: "Please add all user details." });
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ error: "Email is not in the right format." });
        }

        // 2. DB CHECK (Check karo user exists ya nahi)
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({
                error: "Bhai, ye email already registered hai. Login karle!"
            });
        }

        // 3. HEAVY LIFTING (Ab hashing karo, jab confirm hai ki user valid hai)
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // 4. DB INSERT
        const result = await pool.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id, name, email',
            [name, email, hashedPassword]
        );

        const user = result.rows[0];
        const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(201).cookie('token', token, cookieOptions).json({
            message: "Mubarak ho! Account ban gaya.",
            user: { id: user.id, name: user.name, email: user.email }
        });

    } catch (err) {
        console.error("Signup Error:", err.message);
        // Centralized error handling
        return res.status(500).json({ error: "Internal Server Error", details: err.message });
    }
};

export const login = async (req, res) => {
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

        const token = jwt.sign({ userId: user.id, name: user.name, email: user.email }, process.env.JWT_SECRET, { expiresIn: '24h' });

        return res.status(200).cookie('token', token, cookieOptions).json({
            message: "Welcome back! Login successful.",
            user: { id: user.id, name: user.name, email: user.email }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server ki halat kharab hai (Server Error)");
    }
};