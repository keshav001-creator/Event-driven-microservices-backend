const db=require("../config/mysql")


async function connectDB() {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("MySQL connected");
  } catch (err) {
    console.error("DB connection failed ", err);
  }
}


module.exports=connectDB