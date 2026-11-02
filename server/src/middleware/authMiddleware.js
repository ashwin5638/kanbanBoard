const jwt = require('jsonwebtoken')

const authentication = (req, res, next) => {

    const authHeader = req.header('Authorization')
    const token = authHeader?.split(' ')[1]

    if(!token){
        return res.status(401).json({ success: false, error: 'Access denied. No token provided.' })
    }

    try{

        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ success: false, error: 'Invalid token.' });
            }
            req.user = {
                ...decoded,
                id: decoded.id || decoded.userId,
                userId: decoded.userId || decoded.id,
            };
            next();
        });


    } catch(err){
        return res.status(500).json({ success: false, error: err.message });
    }
    
}

module.exports = authentication

