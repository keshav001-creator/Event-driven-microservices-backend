const express=require("express")
const {createOrder,getMyOrder,getMyOrderById, cancelMyOrderById}=require("../controller/order.controller")
const createAuthMiddleware=require("../middlewares/auth.middleware")



router=express.Router()


router.post("/order",createAuthMiddleware(["user"]),createOrder)
router.get("/my",createAuthMiddleware(["user"]),getMyOrder)
router.get("/:id",createAuthMiddleware(["user"]),getMyOrderById)
router.post("/cancel/:id",createAuthMiddleware(["user"]),cancelMyOrderById)
// router.patch("/:id",createAuthMiddleware(["user"]),updateOrderAddress)




module.exports=router