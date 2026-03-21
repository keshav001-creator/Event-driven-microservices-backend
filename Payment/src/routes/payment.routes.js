const express=require("express")
const {createPayment,verifyPayment}=require("../controller/payment.controller")
const createAuthMiddleware=require("../middleware/auth.middleware")



router=express.Router()

router.post("/create/:orderId",createAuthMiddleware(["user"]),createPayment)
router.post("/payment/verify",createAuthMiddleware(["user"]),verifyPayment)


module.exports=router