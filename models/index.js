const fs = require("fs");
const path = require("path");
const Sequelize = require("sequelize");
const basename = path.basename(__filename);

const config = {
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  dialect: process.env.DB_DIALECT,
  port: process.env.DB_PORT,
  // schema: , //process.env.DB_SCHEMA,
  logging: false,
  operatorsAliases: false,
};
const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  {
    host: config.host,
    dialect: config.dialect,
    // schema: config.schema,
    port: config.port,
    logging: config.logging,
    pool: {
      max: 20,
      min: 0,
      acquire: 60000,
      idle: 10000 ,
      dialectOptions: {
        connectTimeout: 60000
      }
    },
  }
);
//Connection Test
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch((err) => {
    console.error("Unable to connect to the database:", err);
  });

fs.readdirSync(__dirname)
  .filter((file) => {
    return (
      file.indexOf(".") !== 0 && file !== basename && file.slice(-3) === ".js"
    );
  })
  .forEach((file) => {
    // const model = sequelize['import'](path.join(__dirname, file));
    const model = require(path.join(__dirname, file))(
      sequelize,
      Sequelize.DataTypes
    );
    db[model.name] = model;
  });

Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});
// sequelize
//   .sync({ alter: true })
//   .then(function () {
//     console.log("tables created successfully");
//   })
//   .catch((err) => {
//     console.log(err);
//   });

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
