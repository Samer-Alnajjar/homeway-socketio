"use strict";

// 3rd Party Resources
const express = require("express");
const socketio = require("socket.io");
const Filter = require("bad-words");
const http = require("http");
const { v4: uuidv4 } = require("uuid");

// Packages for cookies
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const session = require("express-session");

const client = require("../DataBase/data");

const cors = require("cors");
require("dotenv").config();

// Esoteric Resources
const errorHandler = require("./error-handlers/500");
const notFound = require("./error-handlers/404.js");

// Prepare the express app
const app = express();
// app.use(
//   cors({
//     origin: ["http://localhost:9000"],
//     methods: ["GET", "POST", "PUT", "DELETE"],
//     credentials: true,
//   })
// );
app.use(cors());

app.use(cookieParser());
// app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    key: "userID",
    secret: process.env.SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      expires: 60 * 60 * 24,
    },
  })
);

const Router = express.Router();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// app.use(express.static(__dirname + "../public"));
app.set("views", __dirname + "/../public/views");
app.engine("html", require("ejs").renderFile);
app.set("view engine", "html");

// Requiring files
const basicAuth = require("./auth/middleware/basic");
const basicAdmin = require("./auth/middleware/basicAdmin");
const bearerAuth = require("./auth/middleware/bearer");
const bearerVolunteer = require("./auth/middleware/bearerVolunteer");
const bearerHost = require("./auth/middleware/bearerHost");

const {
  handleSearchBar,
  handleDisplaySearch,
  handleHome,
  handleHostForm,
  handleSignInForm,
  handleSignIn,
  handleVolunteerSignup,
  handleHostSignup,
  handleVolunteerForm,
  handleGetVolunteerProfile,
  updateVolunteerProfile,
  updateHostProfile,
  createServiceProfile,
  updateServiceProfile,
  handleVolunteerViewingHost,
  handleVolunteerViewingHostService,
  handleGetHostProfile,
  handleGetHostService,
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
} = require("./auth/models/users");

// App Level MW
//AOuth
const { OAuth2Client } = require("google-auth-library");
const CLIENT_ID =
  "828937553057-8gc5eli5vu3v2oig6rphup580sg33lj4.apps.googleusercontent.com";
const Gclient = new OAuth2Client(CLIENT_ID);

// Oauth

app.get("/", (req, res) => {
  res.render("index");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  let token = req.body.token;

  async function verify() {
    const ticket = await Gclient.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    const userid = payload["sub"];
  }
  verify()
    .then(() => {
      res.cookie("session-token", token);
      res.send("success");
    })
    .catch(console.error);
});

app.get("/profile", checkAuthenticated, (req, res) => {
  let user = req.user;
  res.render("profile", { user });
});

app.get("/protectedRoute", checkAuthenticated, (req, res) => {
  res.send("This route is protected");
});

app.get("/logout", (req, res) => {
  res.clearCookie("session-token");
  res.redirect("/login");
});

function checkAuthenticated(req, res, next) {
  let token = req.cookies["session-token"];

  let user = {};
  async function verify() {
    const ticket = await Gclient.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID, // Specify the CLIENT_ID of the app that accesses the backend
    });
    const payload = ticket.getPayload();
    user.name = payload.name;
    user.email = payload.email;
    user.picture = payload.picture;
  }
  verify()
    .then(() => {
      req.user = user;
      next();
    })
    .catch((err) => {
      res.redirect("/login");
    });
}

// ****************************SOCKETIO*******************************
const server = http.createServer(app);
const io = socketio(server);

const users = []

const addUser = ({ id, username, room }) => {
    // Clean the data
    username = username.trim().toLowerCase()
    room = room.trim().toLowerCase()
    // Validate the data
    if (!username || !room) {
        return {
            error: 'Username and room are required!'
        }
    }

    // Check for existing user
    const existingUser = users.find((user) => {
        return user.room === room && user.username === username
    })

    // Validate username
    if (existingUser) {
        return {
            error: 'Username is in use!'
        }
    }

    // Store user
    const user = { id, username, room }
    users.push(user)
    return { user }
}

const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
        return users.splice(index, 1)[0]
    }
}

const getUser = (id) => {
    return users.find((user) => user.id === id)
}

const getUsersInRoom = (room) => {
    room = room.trim().toLowerCase()
    return users.filter((user) => user.room === room)
}

const generateMessage = (username, text) => {
  return {
      username,
      text,
      createdAt: new Date().getTime()
  }
}

// socket
io.on('connection', (socket) => {
  console.log('New WebSocket connection')

  socket.on('join', (options, callback) => {
      const { error, user } = addUser({ id: socket.id, ...options })

      if (error) {
          return callback(error)
      }

      socket.join(user.room)

      socket.emit('message', generateMessage(`${user.room}`, `Welcome ${user.username}`))
      socket.broadcast.to(user.room).emit('message', generateMessage('Admin', `${user.username} has joined!`))
      io.to(user.room).emit('roomData', {
          room: user.room,
          users: getUsersInRoom(user.room)
      })
      callback()
  })

  socket.on('sendMessage', (message, callback) => {
      const user = getUser(socket.id)
      const filter = new Filter()

      if (filter.isProfane(message)) {
          return callback('Profanity is not allowed!')
      }

      io.to(user.room).emit('message', generateMessage(user.username, message))
      callback()
  })

  socket.on('disconnect', () => {
      const user = removeUser(socket.id)
      if (user) {
          io.to(user.room).emit('message', generateMessage('Admin', `${user.username} has left!`))
          io.to(user.room).emit('roomData', {
              room: user.room,
              users: getUsersInRoom(user.room)
          })
      }
  })
})

app.get('/volunteer/:volId/host/:hostId/chat', handleVolunteerSocket)
app.get('/host/:hostId/volunteer/:volId/chat', handleHostSocket)
app.get('/chatRoom', handelChat)

// Socketio functions

async function handleVolunteerSocket(req, res) {
  let volId = req.params.volId;
  let hostId = req.params.hostId;
  let roomId = hostId;
  const volunteerSearch = "select * from volunteer where id = $1;";
  let volunteerData = await client.query(volunteerSearch, [volId]);
  console.log(volunteerData.rows[0]);
  let data = {username: volunteerData.rows[0].user_name, room: hostId};
  // // console.log(data);

    res.render("joinroom", {data});
}

async function handleHostSocket(req, res) {
  let volId = req.params.volId;
  let hostId = req.params.hostId;
  const searchHost = "select * from host where id = $1;";
  let hostData = await client.query(searchHost, [hostId]);

  console.log(hostData.rows);
  let data = {username: hostData.rows[0].user_name, room: hostId};
  res.render("joinroom", {data})
}

function handelChat(req, res) {
  res.render('chat')
}

// *******************************************************************

// Routes

app.get("/volunteer/:id", bearerVolunteer, handleGetVolunteerProfile);
app.put("/volunteer/:id", bearerVolunteer, updateVolunteerProfile);
app.get("/volunteer/:id/host/:id", bearerVolunteer, handleVolunteerViewingHost);
app.get(
  "/volunteer/:id/host/:id/service/:id",
  bearerVolunteer,
  handleVolunteerViewingHostService
);

app.get("/host/:id", bearerHost, handleGetHostProfile);
app.put("/host/:id", bearerHost, updateHostProfile);
app.get("/host/:id/service", bearerHost, handleGetHostService);
app.post("/host/:id/service", bearerHost, createServiceProfile);
app.get("/host/:id/service/:id", bearerHost, handleOneHostService);
app.put("/host/:id/service/:id", bearerHost, updateServiceProfile);
app.delete("/host/:id/service/:id", bearerHost, deleteServiceProfile);
app.get("/host/:id/volunteer/:id", bearerHost, handleHostViewingVolunteer);
console.log(handleHome);

app.get("/", handleHome);

app.get("/volunteer/:id/host/:id", handleHome);

app.get("/volunteers/sign_up", handleVolunteerForm);
app.post("/volunteers/sign_up", handleVolunteerSignup);
app.get("/hosts/sign_up", handleHostForm);
app.post("/hosts/sign_up", handleHostSignup);
app.get("/sign_in", handleSignInForm);
app.post("/sign_in", basicAuth, handleSignIn);
app.post("/superuser", basicAdmin, handleAdmin);
// app.post("/superuser/sign_up", addAdmin);

app.post("/searchResults", handleSearchBar);
app.get("/searchResults", handleDisplaySearch);


//admin\\

app.get("/superuser/host/:id", basicAdmin, handleAdminHost);
app.put("/superuser/host/:id", basicAdmin, updateHostProfile);
app.delete("/superuser/host/:id", basicAdmin, deleteHostProfile);

app.get("/superuser/volunteer/:id", basicAdmin, handleAdminVolunteer);
app.put("/superuser/volunteer/:id", basicAdmin, updateVolunteerProfile);
app.delete("/superuser/volunteer/:id", basicAdmin, deleteVolunteerProfile);

app.get("/superuser/service/:id", basicAdmin, handleAdminHostService);
app.put("/superuser/service/:id", basicAdmin, updateServiceProfile);
app.delete("/superuser/service/:id", basicAdmin, deleteServiceAdmin);

// Catchalls
app.get("/error", (req, res) => {
  throw new Error("Server Error ");
});
app.use("*", notFound);
app.use(errorHandler);

module.exports = {
  server: app,
  start: (PORT) => {
    client
      .connect()
      .then(() => {
        server.listen(PORT, () => {
          console.log(`SERVER IS HERE  ${PORT}`);
        });
      })
      .catch((error) => {
        console.log("Error while connecting to the DB ..", error);
      });
  },
};
