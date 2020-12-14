import * as express from "express";
import * as exCore from "express-serve-static-core";
import * as mysql from "mysql2/promise";
import * as jwt from "jsonwebtoken";
import * as removeRoute from "express-remove-route";

//services
class DatabaseService {
  pool: mysql.Pool;
  username: string = "Kishan";
  password: string = "123";
  database: string = "User";
  host: string = "localhost";
  port: number = 3303;

  constructor() {
    this.pool = mysql.createPool({
      connectionLimit: 10,
      user: this.username,
      password: this.password,
      database: this.database,
      host: this.host,
      port: this.port,
    });
  }

  async getConnection(): Promise<mysql.Connection> {
    return this.pool.getConnection();
  }
}

class UserService {
  getID() {}
}

//single server point
class Services {
  user = new UserService();
  db = new DatabaseService();
}
export const services = new Services();

//controllers
class Controller {
  router: exCore.Router;
  constructor(router: exCore.Router) {
    this.router = router;
    this.bind();
  }
  bind() {}
  unBind() {}
}

export class UserController extends Controller {
  bind() {
    this.router.use("/user:id", this.getUser);
  }

  getUser(request: exCore.Request, response: exCore.Response) {}
}

export class App {
  server: exCore.Express;
  router: exCore.Router;
  static port: Number = 8080;

  controllers: {
    user: UserController;
  };

  constructor() {
    this.server = express();
    this.router = express.Router();
    this.bindController();
  }

  bindController() {
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
