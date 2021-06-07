"use strict";

require("dotenv").config();

// Start the web server
require("./src/server.js").start(process.env.PORT || 9000);
