const jwt = require("jsonwebtoken")
const db = require("../config/mysql")

async function authMiddleware(req, res, next) {

    const token = req.cookies.token

    if (!token) {
        return res.status(200).json({ message: "unauthorised user" })
    }

    try {

        const decode = jwt.verify(token, process.env.JWT_SECRET_KEY)


        const [user]=await db.execute(
            `SELECT user_id FROM users WHERE user_id=?`,
            [decode.id]
        )
        if (user.length === 0) {
            return res.status(401).json({ message: "User no longer exists" });
        }
        
        const User = decode //decode have data of user in token
        req.user = User
        next()

    } catch (err) {
        console.log("error:", err)
        return res.status(500).json({ message: "internal server error" })
    }
}


module.exports = { authMiddleware }