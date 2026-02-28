const{body, validationResult}=require("express-validator")

function handleValidationError(req,res,next){

    const error=validationResult(req)
    if(!error.isEmpty()){
        return res.status(400).json({message:"Validation error"})
    }
    next()
}


const createProductValidators=[

    body("title")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("title is requried"),
        
    body("description")
        .isString()
        .trim()
        .notEmpty()
        .withMessage("description must be a String")
        .isLength({max:500})
        .withMessage("description max length is 500 charchters"),

    body("priceAmount")
        .notEmpty()
        .withMessage("priceAmount is required")
        .bail()
        .isFloat({gt:0})
        .withMessage("priceCurrency must be a number > 0"),
        
    body("priceCurrency")
        .optional()
        .isIn(["USD","INR"])
        .withMessage("priceCurrency must be USD or INR"),

        handleValidationError

]

module.exports={createProductValidators}