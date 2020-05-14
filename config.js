module.exports = {
	bot: {
		prefix: "_",
		// This shouldn't break anything, let me know if it does
		token: (process.env && process.env.TOKEN) || "***REMOVED***",
		levels: {
			roles: {
				// "5": "Fidget Spinner", // (case-sensitive) role name
				// "15": "Intellectual",
				// "30": "Big Chungus",
				// "40": "Sicko Mode",
				// "50": "Ugandan Knuckle"
			}
		}
	},
	// settings for sequelize database connection
	database: {
		dialect: "postgres",
		protocol: "postgres",
		dialectOptions: {
			ssl: true
		},
		logging: false,
		operatorsAliases: 0
	}
}
