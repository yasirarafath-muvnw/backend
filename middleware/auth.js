import jwt from 'jsonwebtoken';

const jwtSecret = "00000000";

export function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Token missing' });
    }

    jwt.verify(token, jwtSecret, (err, user) => {
        if (err) {
            console.log('JWT verify error:', err);
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
}

export const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // const { role } = req.user;
        const role = req.user.role || "USER";

        if (!role) {
            return res.status(401).json({ message: "Role missing in token" });
        }

        if (!allowedRoles.includes(role)) {
            return res.status(403).json({
                message: "You are not allowed to perform this action",
            });
        }
        next();
    };
};

