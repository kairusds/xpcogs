const Sequelize = require("sequelize");
const config = require("./config").database;
const sequelize = new Sequelize(config.database_url, config)

const Users = sequelize.import("models/Users");
sequelize.sync().then(() => console.log("Levels database synced!")).catch(console.error);

module.exports = {
	Users
};