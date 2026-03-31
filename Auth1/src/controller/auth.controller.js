// const userModel = require("../model/user.model")
const db = require("../config/mysql")
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const redis = require("../db/redis")
const { publishToQueue } = require("../broker/broker")

async function RegisterUser(req, res) {

    try {

        const { UserName, userPassword, userEmail, fullName: { FirstName, LastName }, role } = req.body

        const [existingUser] = await db.execute(
            "SELECT user_id FROM users WHERE email=? OR username=?",
            [userEmail, UserName]
        );

        if (existingUser.length > 0) {
            return res.status(200).json({
                message: "User already exists",
            })
        }

        const hashedPassword = await bcrypt.hash(userPassword, 10)

        const [result] = await db.execute(
            `INSERT INTO users
        (username, email,password, first_name, last_name)
        VALUES (?,?,?,?,?)`,
            [UserName, userEmail, hashedPassword, FirstName, LastName]
        )


        const token = jwt.sign({

            id: result.insertId,
            username: UserName,
            email: userEmail,
            role: role || "user"

        }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" })

        await publishToQueue("auth_notification_queue",{
            id: result.insertId,
            username: UserName,
            email: userEmail,
            fullName:{
                firstName:FirstName,
                lastName:LastName
            },
            role: role || "user"
        })

        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 20 * 60 * 60 * 1000
        })


        res.status(200).json({
            message: "user registered successfully"
        })
    } catch (err) {
        res.status(500).json({
            message: "Server error",
            error: err.message
        })
    }
}

async function LoginUser(req, res) {

    try {

        const { UserName, userPassword, userEmail } = req.body

        const [rows] = await db.query(
            `SELECT user_id,username,email,role,password 
            FROM users WHERE 
            username=? OR email=?`,
            [UserName, userEmail]
        );

        if (rows.length === 0) {
            return res.status(400).json({ message: "user not registered" })
        }

        const User = rows[0];

        const isMatch = await bcrypt.compare(userPassword, User.password)

        if (!isMatch) {
            return res.status(400).json({ message: "password invalid" })
        }

        const token = jwt.sign({
            id: User.user_id,
            username: User.username,
            email: User.email,
            role: User.role
        }, process.env.JWT_SECRET_KEY, { expiresIn: "1d" })


        res.cookie("token", token, {
            httpOnly: true,
            secure: true,
            maxAge: 24 * 60 * 60 * 1000
        })

        return res.status(200).json({
            message: "login successfully",
            user: {
                id: User.user_id,
                username: User.username,
                role: User.role,
                email: User.email
            }
        })
    }
    catch (err) {
        console.log("error:", err)
        return res.status(500).json({ message: "internal server error" })
    }
}

async function logoutUser(req, res) {

    const token = req.cookies.token

    if (token) {
        await redis.set(`blacklist:${token}`, "true", "EX", 24 * 60 * 60)
    }

    res.clearCookie("token", {
        httpOnly: true,
        secure: true
    })

    return res.status(200).json({
        message: "user logged out successfully"
    })
}

async function getUser(req, res) {

    const User = req.user
    return res.status(200).json({
        User
    })
}

async function getUserAddress(req, res) {

    const id = req.user.id

    const [rows] = await db.execute(
        `SELECT * FROM user_address WHERE user_id=?`,
        [id]
    )

    return res.status(200).json({
        message: "user address fetched successfully",
        addresses: rows[0] || null
    })
}

async function addUserAddress(req, res) {
    try {

        const id = req.user.id
        const { country, state, city, street, pincode } = req.body;

        const [existingUser] = await db.query(
            "SELECT address_id FROM user_address WHERE user_id=?",
            [id]
        );

        if (existingUser.length > 0) {

            await db.execute(
                `UPDATE user_address
                SET street=?, pincode=?, state=?, city=?, country=?
                WHERE user_id=?`,
                [street, pincode, state, city, country, id]
            )
            return res.status(200).json({
                message: "Address updated successfully",
            })
        }

        await db.execute(
            `INSERT INTO user_address
                (user_id, street, pincode, city, state, country)
                VALUES(?,?,?,?,?,?)
                `,
            [id, street, pincode, city, state, country]
        )


        return res.status(200).json({
            message: "address added successfully",
        })

    } catch (err) {
        res.status(500).json({
            message:"Server Error",
            error:err.message
        })
    }
}


// async function deleteUserAddress(req, res) {

//     const id = req.user.id
//     const { addressId } = req.params

//     const isAddressExist = await userModel.findOne({ _id: id, "addresses._id": addressId })
//     if (!isAddressExist) {
//         return res.status(404).json({ message: "adress not found" })
//     }

//     const user = await userModel.findOneAndUpdate({ _id: id }, {
//         $pull: {
//             addresses: { _id: addressId }
//         }
//     }, { new: true })

//     if (!user) {
//         return res.status(404).json({
//             message: "user does not exist"
//         })
//     }

//     const addressExist = user.addresses.some(addr => addr._id.toString() === addressId)
//     if (addressExist) {
//         return res.status(500).json({
//             message: "failed to delete address"
//         })
//     }

//     return res.status(200).json({
//         message: "address deleted successfully",
//         address: user.addresses
//     })
// }

module.exports = {

    RegisterUser,
    LoginUser,
    logoutUser,
    getUser,
    getUserAddress,
    addUserAddress,
    // deleteUserAddress
}