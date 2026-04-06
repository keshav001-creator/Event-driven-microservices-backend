const mysql=require("mysql2/promise")

const mySqlPool=mysql.createPool({
    host:"localhost",
    user:"root",
    password:"Myskes123!",
    database:"ms_cart"
})


module.exports=mySqlPool