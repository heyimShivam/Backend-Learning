import jwt from 'jsonwebtoken';
const JWT_SECRET = "tera_khufiya_code_123";

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const headerToken = authHeader && authHeader.split(' ')[1];
    const cookieToken = req.cookies ? req.cookies.token : null;

    const token = headerToken || cookieToken;

    if (!token) return res.status(401).json({ loggedIn: false, error: "Token kahan hai, bhai? Login karo!" });

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json({ loggedIn: false, error: "Token expire ya galat hai!" });

        req.user = user;
        next();
    });
};

export default authenticateToken;