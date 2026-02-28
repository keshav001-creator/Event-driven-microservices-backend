const express = require("express")
const multer = require("multer")
const createAuthMiddleware = require("../middlewares/auth.middleware")
const { createProduct, getProducts, getProductbyId, updateProduct, deleteProduct, productsBySeller} = require("../controller/product.controller")
const { createProductValidators } = require("../middlewares/validator.middleware")

const router = express.Router()

const upload = multer({ storage: multer.memoryStorage() })


router.post("/", createAuthMiddleware(["admin", "seller"]), upload.array("images", 5),
    createProductValidators, createProduct)
    
router.get("/", getProducts)
router.patch("/:id",createAuthMiddleware(["seller"]), updateProduct)
router.delete("/:id",createAuthMiddleware(["seller"]), deleteProduct)

router.get("/seller",createAuthMiddleware(["seller"]),productsBySeller)

router.get("/:id", getProductbyId)


module.exports = router