require("source-map-support").install();
import "core-js/stable";
import "regenerator-runtime/runtime";
import * as core from "express-serve-static-core";
import * as express from "express";
import * as mysql from "mysql2/promise";
import * as jwt from "jsonwebtoken";
import * as removeRoute from "express-remove-route";

//Utils
class Db {
  static resultToJson(rows: any, fields: any) {
    const names = fields.map((value) => value.name);
    const result = [];
    for (let index = 0; index < rows.length; index++) {
      const object = {} as any;
      for (let nameIndex = 0; nameIndex < names.length; nameIndex++) {
        object[names[nameIndex]] = rows[index][nameIndex];
      }
      result.push(object);
    }
    return result;
  }
}
//Constant

//Model
type CreateUser = {
  username: string;
  role: string;
  password: string;
  email: string;
};

type User = CreateUser & {
  id: number;
};

//Services
class DbService {
  private host: string = process.env.HOST || "localhost";
  private user: string = "root";
  private password: string = process.env.PASSWORD || "@KD@kd@98";
  private db: string = process.env.DB || "mydb";
  pool: mysql.Pool;

  constructor() {
    this.pool = mysql.createPool({
      connectionLimit: 10,
      host: this.host,
      user: this.user,
      password: this.password,
      database: this.db,
    });
  }

  async getConnection(): Promise<mysql.Connection> {
    return this.pool.getConnection();
  }
}

class AuthService {
  async login(user: string, password: string) {
    let [rows]: any[] = await Services.db.pool.query(
      `select * from users where`
    );
    return rows.length !== 0;
  }

  authenticate(req: core.Request, res: core.Response, next: core.NextFunction) {
    try {
      const token = req.headers.authorization.split(" ")[1];
      const decodedToken = jwt.verify(token, "RANDOM_TOKEN_SECRET") as any;
      const userId = decodedToken.userId;
      if (req.body.userId && req.body.userId !== userId) {
        throw "Invalid user ID";
      } else {
        next();
      }
    } catch {
      res.status(401).json({
        error: new Error("Invalid request!"),
      });
    }
  }
}

class UsersService {
  async get(offset: number = 0, limit: number = 10) {
    let [
      rows,
      fields,
    ] = await Services.db.pool.query(`select * from users limit ?, ?`, [
      offset,
      limit,
    ]);
    return rows as User[];
  }

  async getById(id: string) {
    let [rows] = await Services.db.pool.query(
      `select * from users where id=?`,
      [id]
    );
    return (rows[0] as any) as User[] | undefined;
  }

  async add(user: CreateUser) {
    let [
      rows,
    ] = await Services.db.pool.query(
      `insert into users (username, role, password, email) values(?, ?, ? ,?);select LAST_INSERT_ID()`,
      [user.username, user.role, user.password, user.email]
    );
    return rows;
  }
}

export class Services {
  static db = new DbService();
  static auth = new AuthService();
  static user = new UsersService();
}

//Controllers
class Controller {
  router: core.Router;
  constructor(router: core.Router) {
    this.router = router;
    this.bind();
  }
  bind() {}
  unbind() {}
}

class UserController extends Controller {
  bind() {
    this.users();
    this.login();
  }

  unbind() {}

  users() {
    this.router.get("/users", async (req, res, next) => {
      const user = await Services.user.get();
      if (!user) {
        res.json({
          error: "User not exists",
        });
      } else {
        res.json({
          user,
        });
      }
    });
  }

  login() {
    this.router.get("/user", Services.auth.authenticate, async (req, res) => {
      const id = req.query.id;
      const user = await Services.user.getById(id);
      if (user) {
        res.json({
          error: "User not exists",
        });
      } else {
        res.json({
          user,
        });
      }
    });
  }
}

//Connection
class App {
  static port = 8808;
  server: core.Express;
  router: core.Router;

  controllers: {
    user: UserController;
  };

  constructor() {
    this.server = express();
    this.router = express.Router();
    this.bindControllers();
    this.runServer();
  }

  bindControllers() {
    this.controllers = {
      user: new UserController(this.router),
    };
  }

  runServer() {
    this.server.use("/", this.router);
    this.server.listen(App.port, () => {
      console.log(`Server is running on post: ${App.port}`);
    });
  }
}

new App();
