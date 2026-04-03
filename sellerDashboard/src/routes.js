const express = require("express");
const createAuthMiddleware = require("./middleware/authMiddleware")
const {getMetrics,getOrders,getProducts}=require("./controller/controller")



const router=express.Router()


router.get("/seller/metrics", createAuthMiddleware(["seller"]), getMetrics)
router.get("/seller/orders", createAuthMiddleware(["seller"]), getOrders)
router.get("/seller/products", createAuthMiddleware(["seller"]), getProducts)


module.exports=router