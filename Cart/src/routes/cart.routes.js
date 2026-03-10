const express=require("express")
const createAuthMiddleware=require("../middleware/auth.middleware")
const {validateAddItem}=require("../middleware/validator.middleware")
const{addItem,getItem,deleteCart}=require("../controllers/cart.controller")
const router=express.Router()


router.get("/",createAuthMiddleware(["user"]),getItem)
router.post("/",createAuthMiddleware(["user"]),validateAddItem,addItem)
router.delete("/delete",createAuthMiddleware(["user"]),deleteCart)



module.exports=router