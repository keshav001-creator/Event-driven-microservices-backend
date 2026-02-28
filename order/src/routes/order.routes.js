const express=require("express")
const app=require("../app")
const {createAuthMiddleware}=require("../middlewares/auth.middleware")



router=express.Router()


router.post("/order",createAuthMiddleware(["user"]))




module.exports=router