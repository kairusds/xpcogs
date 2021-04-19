const path = require("path");
const Sequelize = require("sequelize");
const config = require("./config").database;
const sequelize = new Sequelize(process.env.DATABASE_URL, config)

const Users = require(path.join(`${__dirname}/models`, "Users.js"))(sequelize, Sequelize.DataTypes);
sequelize.sync().then(() => console.log("Levels database synced!")).catch(console.error);

module.exports = {
	Users
};