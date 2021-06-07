"use strict";
const fs = require("fs");
const express = require("express");
const Collection = require("../models/data-collection");

const bearerAuth = require("../middleware/bearer.js");
const permissions = require("../middleware/acl.js");

const router = express.Router();
const client = new pg.Client(process.env.DATABASE_URL);

function checkDB(req, res) {
  let selectQ = `select * from book;`;

  client
    .query(selectQ)
    .then((data) => {
      res.render("pages/index", {
        book_data: data.rows,
        counter: data.rowCount,
      });
    })
    .catch((error) => {
      console.log("error while getting data from book table ..", error);
    });
}

router.get("/host", handleGetHostProfile);

async function handleGetHostProfile(req, res) {
  try {
    let allRecords = await req.model.get();
    res.status(200).json(allRecords);
  } catch (error) {
    console.log(error);
  }
}

// async function handleGetHostProfile(req, res) {
//   try {
//     const id = req.params.id;
//     let theRecord = await req.model.get(id);
//     res.status(200).json(theRecord);
//   } catch (error) {
//     console.log(error);
//   }
// }

module.exports = router;
