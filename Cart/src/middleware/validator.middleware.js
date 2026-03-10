const { body, validationResult } = require("express-validator")
const mongoose = require("mongoose")

function handleValidationError(req, res, next) {

    const error = validationResult(req)

    if (!error.isEmpty()) {
        return res.status(400).json({
            message: "Validation error",
            errors: error.array()
        })
    }

    next()
}

const validateAddItem = [

    body("productId")
        .isString()
        .withMessage("ProductId must be a String")
        .notEmpty()
        .withMessage("Product id is required"),

    body("quantity")
        .isInt({ gt: 0 })
        .withMessage("Quantity must be a positive integer"),

    handleValidationError
]

module.exports = { validateAddItem }