module.exports = {
	bot: {
		prefix: "%",
		token: "NTQ3MTg3MjM2NDI5MzY1MjY4.D0zKZw.pzISHT6jHmi3FzD87dXhg7WI6yc",
		levels: {
			roles: {
				"2": "test",
				"5": "Fidget Spinner", // (case-sensitive) role name
				"15": "Intellectual",
				"30": "Big Chungus",
				"40": "Sicko Mode",
				"50": "Ugandan Knuckle"
			}
		}
	},
	// settings for sequelize database connection
	// currently configured for use of a heroku postgresql database
	// the environment variables are passed by heroku when the dyno starts up
	database: {
		username: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_NAME,
		host: process.env.DB_HOSTNAME,
		dialect: "mysql",
		database_url: process.env.DATABASE_URL,
		logging: false,
		operatorsAliases: false
	}
}