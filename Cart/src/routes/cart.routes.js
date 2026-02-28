const express=require("express")
const createAuthMiddleware=require("../middleware/auth.middleware")
const {validateAddItem}=require("../middleware/validator.middleware")
const{addItem}=require("../controllers/cart.controller")
const router=express.Router()



router.get("/",createAuthMiddleware(["user"]),validateAddItem,)




module.exports=router