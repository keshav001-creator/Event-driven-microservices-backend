const express=require("express")
const validator=require("../middleware/validator.middleware")
const controller=require("../controller/auth.controller")
const {authMiddleware}=require("../middleware/auth.middleware")
const route=express.Router()


route.post("/register",validator.registerUserValidator,controller.RegisterUser)
route.post("/login",validator.loginUserValidator,controller.LoginUser)
route.get("/me",authMiddleware,controller.getUser)
route.post("/logout",controller.logoutUser)
route.get("/users/me/addresses",authMiddleware,controller.getUserAddress)
route.post("/users/me/addresses",authMiddleware,validator.userAddressValidator,controller.addUserAddress)
// route.delete("/users/me/addresses/:addressId",authMiddleware,controller.deleteUserAddress)





module.exports=route