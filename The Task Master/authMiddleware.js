import jwt from 'jsonwebtoken';
const JWT_SECRET = "tera_khufiya_code_123";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ error: "Token kahan hai, bhai? Login karo!" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ error: "Token expire ya galat hai!" });

        req.user = user;
        next();
    });
};

export default authenticateToken;