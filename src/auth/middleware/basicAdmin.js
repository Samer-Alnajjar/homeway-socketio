"use strict";

const base64 = require("base-64");
const client = require("../../../DataBase/data");
const bcrypt = require("bcrypt");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      let basic = req.headers.authorization.split(" ").pop();
      let [user, pass] = base64.decode(basic).split(":");

      req.user = await checkAdminExists(user);

      if (!req.user.data) {
        res.json("Error Incorrect username or password");
      } else {
        const hashedPassword = req.user.data.password;
        const success = await bcrypt.compare(pass, hashedPassword);
        req.user = {
          success: success,
          userData: req.user,
        };
        next();
      }
    }
  } catch (e) {
    res.json("Invalid Admin Login");
  }
};

async function checkAdminExists(userName) {
  try {
    const searchQuery = "select * from admin where user_name = $1 ;";
    let data = await client.query(searchQuery, [userName]);
    return ({data: data.rows[0], role : "admin"})
  } catch (e) {
    console.log(e.message);
  }
}
