const mongoose = require("mongoose")

const addressSchema = new mongoose.Schema({
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: String,
    isDefault: {
        type: Boolean,
        default: false
    }
    })


const userSchema = new mongoose.Schema({

    username: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        select: false
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    fullName: {
        FirstName: { type: String, required: true },
        LastName: { type: String, required: true }
    },
    role: {
        type: String,
        default: "user",
        enum: ["user", "seller"],
    },
    addresses: [addressSchema]

})

const userModel = mongoose.model("user", userSchema)

module.exports = userModel