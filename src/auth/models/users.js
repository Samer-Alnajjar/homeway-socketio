"use strict";

const client = require("../../../DataBase/data");
const superagent = require("superagent");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const base64 = require("base-64");
require("dotenv").config();
const secretKey = process.env.SECRET_KEY;

// functions
async function handleSearchBar(req, res) {
  // console.log("From searchBar", req.user, req.token);
  // const countryName = req.body.myCountry;
  // const countryURL = `https://restcountries.eu/rest/v2/name/${countryName}`;
  // return superagent
  //   .get(countryURL)
  //   .then((data) => {
  //     let countryNames = [];
  //     data.body.map((element) => {
  //       countryNames.push(new Country(element));
  //     });
      const query = "SELECT * FROM Service WHERE country=$1 OR title=$2";
      let safeValue = [req.body.myCountry, req.body.WorkField];
      client
        .query(query, safeValue)
        .then((data) => {
          res.json({ searchResults: data.rows });
        })
        .catch((err) => {
          console.log(`error in getting search results from DB ${err}`);
        });
    // })
    // .catch((err) => {
    //   res.json("Please enter a country name");
    //   console.log(`error in getting the Countries names from the API ${err}`);
    // });
}

function handleDisplaySearch(req, res) {
  res.render("searchResults");
}

async function handleHome(req, res) {
  res.render("index");
  // res.send("aya she");

  // const token = req.cookies.JWT_TOKEN;
  // if(token) {
  //   const user = await validateToken(token, JWT_SECRET);

  //   if(user === null) {
  //     res.send
  //   }
  // }
}

function handleVolunteerForm(req, res) {
  res.render("signup_volunteer");
}

function handleHostForm(req, res) {
  res.render("signup_host");
}

function handleSignInForm(req, res) {
  // if(req.session.user) {
  //   res.send({loggedIn: true, user: req.session.user})
  // } else {
  //   res.send({loggedIn: false })
  // }
  res.render("signin");
}

async function handleSignIn(req, res) {
  try {
    if (req.user.success === true) {
      const payload = {
        id: req.user.userData.data.id,
        name: req.user.userData.data.user_name,
        role: req.user.userData.role
      };
      const token = jwt.sign(payload, secretKey);
      // req.session.user = req.user.userData;
      // console.log("session", req.session.user)

      // console.log("token", token);
      // const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_REFRESHER)

      //Check if host ot volunteer
      console.log("Payload", req.user.userData.data)

      let updateQuery;
      if (!req.user.userData.data.category) {
        updateQuery = "update volunteer set token = $1 where user_name = $2;";
      } else {
        updateQuery = "update host set token = $1 where user_name = $2;";
      }
      console.log(`********************************`);
      // Store the refresh token in DB
      const safeValues = [token, req.user.userData.data.user_name];
      client
        .query(updateQuery, safeValues)
        .then(() => {
          console.log(`Updated the token`);
          res.json({
            username: req.user.userData.data.user_name,
            token: token,
          });
        })
        .catch((error) => {
          res.json("Error while updating the refresh token", error);
        });
      res.setHeader("set-cookie", [
        `JWT_TOKEN=${token}; httponly; samesite=lax`,
      ]);
    } else {
      res.json("Error Incorrect username or password");
    }
    // }
  } catch (e) {
    console.log("Error from catch from sign in", e.message);
  }
}

async function handleVolunteerSignup(req, res) {
  try {
    // Checking if the volunteer exists in the DB
    let results = 0;
    const userName = req.body.username;

    results = await checkVolunteerExists(userName);

    if (results.length === 0) {
      results = await checkHostExists(userName);
    }

    if (results.length === 0) {
      const formData = req.body;
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      // passing data to react
      // const {username, first_name, last_name, email, country, birth_date, address} = formData;

      // const password = hashedPassword;

      // 

      let insertQuery =
        "insert into volunteer(user_name, first_name, last_name, password, email, country, birth_date, address) values ($1, $2, $3, $4, $5, $6, $7, $8)";
      const safeValues = [
        formData.username,
        formData.first_name,
        formData.last_name,
        hashedPassword,
        formData.email,
        formData.country,
        formData.birth_date,
        formData.address,
      ];

      client
        .query(insertQuery, safeValues)
        .then((data) => {
          // console.log(`Volunteer added to the database`);
          res.json("success Volunteer created successfully");
        })
        .catch((error) => {
          // console.log('Error while creating the a volunteer', error)
          res.json("Error, Volunteer was not created successfully");
        });
    } else {
      res.json("Error Volunteer already exists");
    }
  } catch (e) {
    res.send(e.message);
  }
}

async function handleHostSignup(req, res) {
  try {
    // Checking if the host exists in the DB
    let results;
    const userName = req.body.username;

    results = await checkHostExists(userName);

    if (results.length === 0) {
      results = await checkVolunteerExists(userName);
    }

    if (results.length === 0) {
      const formData = req.body;
      const hashedPassword = await bcrypt.hash(req.body.password, 10);

      let insertQuery =
        "insert into host(user_name, first_name, last_name, password, email, country, birth_date, address, category) values ($1, $2, $3, $4, $5, $6, $7, $8, $9)";
      const safeValues = [
        formData.username,
        formData.first_name,
        formData.last_name,
        hashedPassword,
        formData.email,
        formData.country,
        formData.birth_date,
        formData.address,
        formData.category,
      ];

      client
        .query(insertQuery, safeValues)
        .then((data) => {
          console.log(`Host added to the database`);
          res.json("success Host created successfully");
        })
        .catch((error) => {
          res.json("Error Host was not created successfully");
        });
    } else {
      res.json("Error Host already exists");
    }
  } catch (e) {
    res.send(e.message);
  }
}

function checkVolunteerExists(userName) {
  try {
    const searchQuery = "select * from volunteer where user_name = $1 ;";

    return client
      .query(searchQuery, [userName])
      .then((data) => {
        return data.rows;
      })
      .catch((error) => {
        console.log("Error while checking if the volunteer in the DB", error);
      });
  } catch (e) {
    console.log(e.message);
  }
}

function checkHostExists(userName) {
  try {
    const searchQuery = "select * from host where user_name = $1;";

    return client
      .query(searchQuery, [userName])
      .then((data) => {
        return data.rows;
      })
      .catch((error) => {
        console.log("Error while checking if the host in the DB", error);
      });
  } catch (e) {
    console.log(e.message);
  }
}

async function checkHostEmail(email) {
  let searchQ = `select * from host where email = $1`;
  let safeValues = [email];
  let data = await client.query(searchQ, safeValues);
  if (data.rowCount === 0) {
    return false;
  } else return true;
}

async function checkVolunteerUserName(username) {
  let searchQ = `select * from volunteer where user_name = $1`;
  let safeValues = [username];
  let data = await client.query(searchQ, safeValues);
  if (data.rowCount === 0) {
    return false;
  } else return true;
}
async function checkVolunteerEmail(email) {
  let searchQ = `select * from volunteer where email = $1`;
  let safeValues = [email];
  let data = await client.query(searchQ, safeValues);
  if (data.rowCount === 0) {
    return false;
  } else return true;
}

async function handleGetVolunteerProfile(req, res) {
  let id = req.params.id;
  let selectQ = `select * from volunteer where id = $1;`;
  let data = await client.query(selectQ, [id]);
  res.send(data.rows[0]);
}
async function handleAdminVolunteer(req, res) {
  let id = req.params.id;
  let selectQ = `select * from volunteer where id = $1;`;
  let data = await client.query(selectQ, [id]);
  res.json(data.rows[0]);
}

async function updateVolunteerProfile(req, res) {
  let userCheck = await checkVolunteerUserName(req.body.user_name);
  let mailCheck = await checkVolunteerEmail(req.body.email);
  if (userCheck) {
    res.json("Username is already exists");
    return;
  }
  if (mailCheck) {
    res.json("Email is already exists");
    return;
  }
  let id = req.params.id;
  let selectQ = `update volunteer set user_name=$1,first_name=$2,last_name=$3,
  password=$4,description=$5,country=$6,birth_date=$7,skills=$8,
  address=$9,rating=$10, profile_image=$11 , passport = $12, email= $13 
  where id = $14 RETURNING *;`;
  let safeValues = [
    req.body.user_name,
    req.body.first_name,
    req.body.last_name,
    req.body.password,
    req.body.description,
    req.body.country,
    req.body.birth_date,
    req.body.skills,
    req.body.address,
    req.body.rating,
    req.body.profile_image,
    req.body.passport,
    req.body.email,
    id,
  ];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows[0]);
}

async function updateHostProfile(req, res) {
  let userCheck = await checkHostUserName(req.body.user_name);
  let mailCheck = await checkHostEmail(req.body.email);
  if (userCheck) {
    res.json("Username is already exists");
    return;
  }
  if (mailCheck) {
    res.json("Email is already exists");
    return;
  }
  let id = req.params.id;
  let selectQ = `update host set user_name=$1,first_name=$2,last_name=$3,
  password=$4,description=$5,country=$6,birth_date=$7,category=$8,
  address=$9,rating=$10,profile_image=$11 
  where id = $12 RETURNING *;`;
  let safeValues = [
    req.body.user_name,
    req.body.first_name,
    req.body.last_name,
    req.body.password,
    req.body.description,
    req.body.country,
    req.body.birth_date,
    req.body.category,
    req.body.address,
    req.body.rating,
    req.body.profile_image,
    id,
  ];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}
async function createServiceProfile(req, res) {
  let host_id = req.params.id;
  let selectQ = `insert into service  (title,description,country,
  type,details,duration,from_date,to_date,working_hours,
  working_days,minumim_age,address,profile_image,host_id)
  values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)  RETURNING *;`;

  let safeValues = [
    req.body.title,
    req.body.description,
    req.body.country,
    req.body.type,
    req.body.details,
    req.body.duration,
    req.body.from_date,
    req.body.to_date,
    req.body.working_hours,
    req.body.working_days,
    req.body.minumim_age,
    req.body.address,
    req.body.profile_image,
    host_id,
  ];

  let data = await client.query(selectQ, safeValues);
  res.redirect(`/host/${host_id}/service`);
}

async function updateServiceProfile(req, res) {
  let id = req.params.id;
  let selectQ = `update service set title=$1,description=$2,country=$3,
  type=$4,details=$5,duration=$6,from_date=$7,to_date=$8,working_hours=$9,
  working_days=$10,minumim_age=$11,address=$12,profile_image=$13
  where id = $14 RETURNING *;`;
  let safeValues = [
    req.body.title,
    req.body.description,
    req.body.country,
    req.body.type,
    req.body.details,
    req.body.duration,
    req.body.from_date,
    req.body.to_date,
    req.body.working_hours,
    req.body.working_days,
    req.body.minumim_age,
    req.body.address,
    req.body.profile_image,
    id,
  ];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}

async function handleVolunteerViewingHost(req, res) {
  let id = req.params.id;

  let selectHostQuery = `select * from host where id =$1;`;
  let host = await client.query(selectHostQuery, [id]);
  let selectServiceQuery = `select * from service where host_id =$1;`;
  let services = await client.query(selectServiceQuery, [id]);
  res.json({
    host: host.rows[0],
    services: services.rows,
  });
}

async function handleVolunteerViewingHostService(req, res) {
  let id = req.params.id;

  let selectHost_idQuery = `select host_id from service where id = $1;`;
  let host = await client.query(selectHost_idQuery, [id]);

  let host_id = host.rows[0].host_id;
  let selectServiceQuery = `select * from service where host_id = $1 AND id = $2;`;
  let safeValues = [host_id, id];
  let service = await client.query(selectServiceQuery, safeValues);
  res.json(service.rows[0]);
}

async function handleGetHostProfile(req, res) {
  let id = req.params.id;
  let newValue = req.body;
  let selectQ = `select * from host where id = $1;`;
  let safeValues = [id];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}
async function handleAdminHost(req, res) {
  let id = req.params.id;
  let newValue = req.body;
  let selectQ = `select * from host where id = $1;`;
  let safeValues = [id];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows[0]);
}
async function handleGetHostService(req, res) {
  let id = req.params.id;
  console.log(id);
  let selectQ = `select * from service where host_id = $1;`;
  let safeValues = [id];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}
async function handleOneHostService(req, res) {
  let id = req.params.id;
  let selectQ = `select * from service where id = $1;`;
  let safeValues = [id];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}
async function handleAdminHostService(req, res) {
  let id = req.params.id;
  let selectQ = `select * from service where id = $1;`;
  let safeValues = [id];
  let data = await client.query(selectQ, safeValues);
  res.json(data.rows);
}
async function deleteServiceProfile(req, res) {
  let id = req.params.id;
  let safeValues = [id];
  let selectHost = `select host_id from service where id =$1;`;
  let host_id = await client.query(selectHost, safeValues);
  let selectQ = `delete from service where id = $1;`;
  let data = await client.query(selectQ, safeValues);
  res.redirect(`/host/${host_id.rows[0].host_id}/service`);
}
async function deleteServiceAdmin(req, res) {
  let id = req.params.id;
  let safeValues = [id];
  let selectHost = `select host_id from service where id =$1;`;
  let host_id = await client.query(selectHost, safeValues);
  let selectQ = `delete from service where id = $1;`;
  let data = await client.query(selectQ, safeValues);
  res.redirect(`/superuser`);
}
async function deleteHostProfile(req, res) {
  let id = req.params.id;
  let selectQ = `delete from host where id = $1;`;
  let data = await client.query(selectQ, [id]);
  res.redirect(`/superuser`);
}
async function deleteVolunteerProfile(req, res) {
  let id = req.params.id;
  let selectQ = `delete from volunteer where id = $1;`;
  let data = await client.query(selectQ, [id]);
  res.redirect(`/superuser/volunteer/${id}`);
}

async function handleHostViewingVolunteer(req, res) {
  let id = req.params.id;

  let selectVolunteerQuery = `select * from volunteer where id =$1;`;
  let volunteer = await client.query(selectVolunteerQuery, [id]);
  res.json(volunteer.rows[0]);
}

async function handleAdmin(req, res) {
  try {
    if (req.user.success === true) {
      const payload = {
        id: req.user.userData.data.id,
        name: req.user.userData.data.user_name,
        role: req.user.userData.role
      };
      const token = jwt.sign(payload, secretKey);

      // const refreshToken = jwt.sign(payload, process.env.SECRET_KEY_REFRESHER)

      //Check if host ot volunteer

      const updateQuery = "update admin set token = $1 where user_name = $2;";

      const searchVolunteers = "select * from volunteer";
      const searchHosts = "select * from host";
      const searchServices = "select * from service";

      // Store the refresh token in DB
      const safeValues = [token, req.user.userData.user_name];
      await client.query(updateQuery, safeValues);
      // Get all the data
      let volunteers = await client.query(searchVolunteers);
      let hosts = await client.query(searchHosts);
      let services = await client.query(searchServices);

      res.json({
        volunteers: volunteers.rows,
        hosts: hosts.rows,
        services: services.rows,
      });

      // res.setHeader("set-cookie", [
      //   // `JWT_TOKEN=${token}; httponly; samesite=lax`,
      // ]);
    } else {
      res.json("Error Incorrect username or password");
    }
    // }
  } catch (e) {
    console.log("Error from catch from sign in", e.message);
  }
}

// functions
async function checkHostUserName(username) {
  let searchQ = `select * from host where user_name = $1`;
  let safeValues = [username];
  let data = await client.query(searchQ, safeValues);
  if (data.rowCount === 0) {
    return false;
  } else return true;
}

async function addAdmin(req, res) {
  const adminData = req.body;
  const insertQuery =
    "insert into admin(user_name, first_name, last_name, password, email) values($1, $2, $3, $4, $5) returning *;";
  const hashedPassword = await bcrypt.hash(req.body.password, 10);

  const safeValues = [
    adminData.user_name,
    adminData.first_name,
    adminData.last_name,
    hashedPassword,
    adminData.email,
  ];
  let admin = await client.query(insertQuery, safeValues);
  console.log(`**************************************`);
  console.log("Added a new admin", admin);
}

//constructors
function Country(data) {
  this.country = data.name;
  this.flag = data.flag;
}

module.exports = {
  handleSearchBar,
  handleDisplaySearch,
  handleHome,
  handleHostForm,
  handleSignInForm,
  handleSignIn,
  handleVolunteerSignup,
  handleHostSignup,
  handleVolunteerForm,
  checkVolunteerExists,
  checkHostEmail,
  checkVolunteerUserName,
  checkVolunteerEmail,
  checkHostExists,
  handleGetVolunteerProfile,
  updateVolunteerProfile,
  updateHostProfile,
  createServiceProfile,
  updateServiceProfile,
  handleVolunteerViewingHost,
  handleVolunteerViewingHostService,
  handleGetHostProfile,
  handleGetHostService,
  checkHostUserName,
  handleOneHostService,
  deleteServiceProfile,
  handleHostViewingVolunteer,
  handleAdmin,
  handleAdminHost,
  handleAdminVolunteer,
  handleAdminHostService,
  deleteHostProfile,
  deleteVolunteerProfile,
  deleteServiceAdmin,
  addAdmin,
};
