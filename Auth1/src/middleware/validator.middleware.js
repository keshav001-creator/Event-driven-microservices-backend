const { body, validationResult } = require("express-validator")

const UserValidationResponse = (req, res, next) => {

    const errors = validationResult(req)

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() })
    }

    next()
}

const registerUserValidator = [
    body("UserName")
        .isString()
        .withMessage("Username must be a String")
        .isLength({ min: 3 })
        .withMessage("Username length must be minimum 3"),

    body("userEmail")
        .isEmail()
        .withMessage("Enter valid Email Address"),

    body("userPassword")
        .isLength({ min: 6 })
        .withMessage("Minimum length of the password must be 6"),

    body("fullName.FirstName")
        .isString()
        .withMessage("FirstName must be a string")
        .notEmpty()
        .withMessage("it is required"),


    body("fullName.LastName")
        .isString()
        .withMessage("LastName must be a string")
        .notEmpty()
        .withMessage("it is required"),

    UserValidationResponse

]


const loginUserValidator = [
    body("UserName")
        .optional()
        .isString()
        .withMessage("username did not matched"),

    body("userEmail")
        .optional()
        .isString()
        .withMessage("email did not matched"),

    body("userPassword")
        .isLength({ min: 6 })
        .withMessage("Password must be of length 6"),

    (req, res, next) => {
        if (!req.body.userEmail && !req.body.UserName) {

            return res.status(400).json({
                errors: [{ msg: "either email or username is required" }]
            })
        }
        UserValidationResponse(req, res, next)
    },

]

const userAddressValidator = [
    body("country")
        .isString()
        .withMessage("country must be a String")
        .notEmpty()
        .withMessage("country is required"),

    body("state")
        .isString()
        .withMessage("state must be a String")
        .notEmpty()
        .withMessage("state is required"),

    body("city")
        .isString()
        .withMessage("city must be a String")
        .notEmpty()
        .withMessage("city is required"),

    body("street")
        .isString()
        .withMessage("street must be a String")
        .notEmpty()
        .withMessage("street is required"),

    body("pincode")
        .isLength({ min: 5, max: 6 })
        .withMessage("pincode must be 5–6 dig   its")
        .matches(/^\d+$/)
        .withMessage("pincode must contain only numbers"),


    body("isDefault")
        .optional()
        .isBoolean()
        .withMessage("isDefault must be true or false"),

    UserValidationResponse
]


module.exports = {
    registerUserValidator,
    loginUserValidator,
    userAddressValidator
}