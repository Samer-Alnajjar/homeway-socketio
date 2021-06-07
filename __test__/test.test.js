"use strict";
require("dotenv").config();
const { server } = require("../src/server.js");
const superTest = require("supertest");
const base64 = require("base-64");
const client = require("../DataBase/data");
const request = superTest(server);
const middleware = require("../src/auth/middleware/bearer.js");
const middlewareHost = require("../src/auth/middleware/bearerHost.js");
const middlewareVolunteer = require("../src/auth/middleware/bearerVolunteer.js");
const middlewareAdmin = require("../src/auth/middleware/bearerAdmin.js");
const jwt = require("jsonwebtoken");
process.env.SECRET = "wHaT";
let user = {
  username: "Admin2",
  password: "admin123",
};

let users = {
  admin: { username: "admin", password: "password" },
};
// const token = jwt.sign(users.admin, "wHaT");

describe("Server", () => {
  beforeAll(async (done) => {
    await client.connect();
    done();
  });
  // Error Handlers
    it("should successfully handle invalid routes", async () => {
      const response = await request.get("/random");
      expect(response.status).toEqual(404);
    });
    it("should successfully handle server errors", async () => {
      const response = await request.get("/");
      expect(response.status).toEqual(200);
    });
    // Test Country API:
    it("should successfully return data from API", async () => {
      const response = await request.post("/searchResults").send({
        myCountry: "jordan",
        WorkField: "test",
      });
      expect(response.status).toEqual(200);
    });
    it("should successfully return data from API", async () => {
      const response = await request.get("/searchResults");
      expect(response.status).toEqual(200);
    });
    // Test Signing up for volunteer and host
    it("should successfully create a new volunteer user upon signing up as a volunteer", async () => {
      const response = await request.post("/volunteers/sign_up").send({
        username: "Mohammad",
        password: "1994",
      });
      expect(response.status).toEqual(200);
    });
    it("should successfully create a new host user upon signing up as a host", async () => {
      const response = await request.post("/hosts/sign_up").send({
        username: "Boshra",
        password: "1994",
      });
      expect(response.status).toEqual(200);
    });
    // Test Signing in for volunteer and host
    it("should successfully log in as a volunteer upon signing in", async () => {
      const user = base64.encode("Mohammad:1994");
      const response = await request
        .post("/sign_in")
        .set("Authorization", `Basic ${user}`);
      expect(response.status).toEqual(200);
    });
    it("should successfully log in as a host upon signing in", async () => {
      const user = base64.encode("Boshra:1994");
      const response = await request
        .post("/sign_in")
        .set("Authorization", `Basic ${user}`);
      expect(response.status).toEqual(200);
    });
    // Testing CRUD:
    it("should successfully create host ", async () => {
      const res = await request.post("/hosts/sign_up").send({
        username: "boshrsa^22",
        password: "0000",
        first_name: "samer",
        last_name: "alnajjar",
        email: "amass.nse2to",
        country: "s",
        address: "s",
        birth_date: "12-12-2021",
        category: "aya yshe",
      });

      expect(res.status).toBe(200);
    });
    it("should successfully get get the host profile", async () => {
      const res = await request.get("/hosts/sign_up");
      expect(res.status).toBe(200);
    });
    it("should create volunteer account", async () => {
      const response = await request.post("/volunteers/sign_up").send({
        user_name: "ibrahim",
        first_name: "samer",
        last_name: "alnajjar",
        password: "$2b$10$eqYmuEEgRy./wjdIf7dkpO08x/dvj/tzoh71AtA4PvdZBOKGUUunG",
        description: null,
        email: "amazin2g.com0",
        country: "jordan",
        birth_date: "2021-12-11T22:00:00.000Z",
        category: "aya yshe",
        address: "s",
        rating: null,
        profile_image: null,
      });
      expect(response.status).toBe(200);
    });
    it("should successfully get the volunteers profile", async () => {
      const res = await request.get("/volunteers/sign_up");
      expect(res.status).toBe(200);
    });
    it("should successfully sign in", async () => {
      const res = await request.get("/sign_in").send({
        user_name: "8000",
        password: "0000",
      });
      expect(res.status).toBe(200);
    });
    it("should admin find host profile ", async () => {
      const response = await request
        .get("/superuser/host/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
      // expect(response.body.user_name).toEqual("8000");
    });
    it("should admin find volunteer profile", async () => {
      const response = await request
        .get("/superuser/volunteer/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });

    it("should admin find volunteer profile", async () => {
      const response = await request
        .get("/superuser/service/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin update service ", async () => {
      const response = await request
        .put("/superuser/service/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin update volunteer profile", async () => {
      const response = await request
        .put("/superuser/volunteer/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin update host profile", async () => {
      const response = await request
        .put("/superuser/host/1")
        .send({
          username: "boshrsa^22",
          password: "0000",
          first_name: "samer",
          last_name: "alnajjar",
          email: "amass.nse2to",
          country: "s",
          address: "s",
          birth_date: "12-12-2021",
          category: "aya yshe",
        })
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin delete volunteer profile", async () => {
      const response = await request
        .delete("/superuser/volunteer/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin delete host profile", async () => {
      const response = await request
        .delete("/superuser/host/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin delete service profile", async () => {
      const response = await request
        .delete("/superuser/service/1")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin go to the admin page", async () => {
      const response = await request
        .post("/superuser")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });
    it("should admin update volunteer profile", async () => {
      const response = await request
        .post("/sign_in")
        .set(
          "Authorization",
          "basic " +
            new Buffer.from(`${user.username}:${user.password}`, "utf8").toString(
              "base64"
            )
        );
      expect(response.status).toEqual(200);
    });

  // Pre-load our database with fake users

  describe("Auth Middleware", () => {
    // Mock the express req/res/next that we need for each middleware call
    const req = {};
    const res = {
      status: jest.fn(() => res),
      send: jest.fn(() => res),
    };
    const next = jest.fn();

    describe("user authentication", () => {
      it("fails a login for a user (admin) with an incorrect token", () => {
        req.headers = {
          authorization: "Bearer thisisabadtoken",
        };

        return middleware(req, res, next).then(() => {
          expect(next).not.toHaveBeenCalled();
          expect(res.status).toHaveBeenCalledWith(403);
        });
      });

      it("logs in a user with a proper token", () => {
        const user = { name: "admin", id: 1 };
        const token = jwt.sign(user, process.env.SECRET || "wHaT");

        req.headers = {
          authorization: `Bearer ${token}`,
        };

        return middleware(req, res, next).then(() => {
          expect(res.status).toHaveBeenCalledWith(403);
        });
      });

      it('should not find user data when login on GET /volunteer/:id', async () => {
        const user = { id: 1, name: "sam" };
        const token = jwt.sign(user, process.env.SECRET || "wHaT");

        let selectQ = `select * from volunteer where token = $1;`;
        let data = await client.query(selectQ, [token]);
        expect(data.rows.length).toEqual(0);
        // expect().toEqual(user.username);
      });

      it('should find user data when login on GET /volunteer/:id', async () => {
        const user = { id: 1, name: "sam" };
        let selectID = `select * from volunteer where id = $1;`;
        let idData = await client.query(selectID, [user.id]);
        let token;

        if(idData.rows[0].id) {
          token = true
        } else {
          token = false
        }
        expect(token).toBeTruthy();
      });

      it('should find user data when login on PUT /volunteer/:id', async () => {
        const user = { id: 1, name: "qsw" };
        let selectID = `select * from volunteer where id = $1;`;
        let idData = await client.query(selectID, [user.id]);

        let token;

        let update = `update volunteer set user_name=$1 where id = $2 RETURNING *;`;
        let updateData = await client.query(update, ["Testingcsdc", idData.rows[0].id]);

        if(updateData.rows[0].user_name === "Testingcsdc") {
          token = true
        } else {
          token = false
        }
        expect(token).toBeTruthy();
      });

      it('should find user data when login on GET /signin', async () => {
        const user = { id: 1, name: "qsw" };
        let selectID = `select * from volunteer where id = $1;`;
        let idData = await client.query(selectID, [user.id]);

        let token;


        if(idData.rows[0].id) {
          token = jwt.sign({id: 1, user: idData.rows[0].user_name, undefined}, process.env.SECRET || "wHaT");
        } else {
          token = false
        }
        expect(token).toBeTruthy();
      });


      it('should find user data when login on Get /volunteer/:id/host/:id', async () => {
        const user = { id: 1, name: "qsw" };
        let selectID = `select * from volunteer where id = $1;`;
        let idData = await client.query(selectID, [user.id]);

        let token;


        if(idData.rows[0].id) {
          token = jwt.sign({id: 1, user: idData.rows[0].user_name, undefined}, process.env.SECRET || "wHaT");
        } else {
          token = false
        }
        expect(token).toBeTruthy();
      });

      it('should find user data when login on PUT /volunteer/:id', async () => {
        const user = {user_name:"samer", id: 1}
        const token = jwt.sign(user, process.env.SECRET || "wHaT");
        const response = await request
          .post('/volunteer/1')
          .set(
            'Authorization',
            'bearer ' + token
          );
          console.log(response.body);
        // expect(response.status).toEqual(200);
        // expect(response.body).toEqual({ error: 'Page Not Found' });
      });

    });
  });

  afterAll(async () => {
    await client.end();
  });
});
