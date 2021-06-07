"use strict";
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const superagent = require("superagent");
const pg = require("pg");
const client = new pg.Client(process.env.DATABASE_URL);

const Router = express.Router();

Router.get("/host", handleGetHostProfile);

// console.log(conString);
// authRouter.get("/users", async (req, res, next) => {
//   const users = await User.find({});
//   const list = users.map((user) => user.username);
//   res.status(200).json(list);
// });

// async function handleGetHostProfile(req, res, next) {
//   try {
//     let selectQ = `select * from book;`;
//     let data = await client.query(selectQ);
//     console.log(data);
//   } catch (error) {
//     console.log("this is the error", error);
//   }
// }
async function handleGetHostProfile(req, res) {
  let selectQ = `select * from users;`;
  console.log("what");
  //   console.log(await client.query(selectQ));
  let data = await client.query(selectQ);
  res.json(data);
}

module.exports = Router;
