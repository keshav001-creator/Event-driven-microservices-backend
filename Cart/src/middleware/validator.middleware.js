const { body, ValidationResult } = require("express-validator")
const  mongoose = require("mongoose")


function handleValidationError(req, res, next) {

    const error = ValidationResult(req)
    if (!error.isEmpty()) {
        return res.status(400).json({ message: "Validation error" })
    }
    next()
}


const validateAddItem = [

    body("productId")
        .isString()
        .withMessage("ProductId must be a String")
        .custom(value=>mongoose.Types.ObjectId.isValid(value))
        .withMessage("Invalid ProductID format"),

    body("quantity")
    .isInt({gt:0})
    .withMessage("Quanitity must be a positive integer"),

    handleValidationError

]



module.exports= {validateAddItem}