module.exports = {
	bot: {
		prefix: "_",
		// This shouldn't break anything, let me know if it does -Benji
		token: (process.env && process.env.TOKEN) || "NTQ3MTg3MjM2NDI5MzY1MjY4.XryjLA.d6H2t8WFb3Ugxn1dMAjVokH5NGQ",
		levels: {
			roles: {
				// the roles will be created if it doesnt exist, just change the position manually if "Display role members separately" is enabled
				"1": {
					"name": "Among",
					"color": "BLURPLE", // see: https://discord.js.org/#/docs/main/stable/typedef/ColorResolvable
					"init_perms": [ // will only be used for creating the role if it doesn't exist
						"MANAGE_EMOJIS",
						"MENTION_EVERYONE"
					] // available permissions: https://discord.js.org/#/docs/main/stable/class/Permissions?scrollTo=s-FLAGS
				},
				"3": {
					"name": "Sussy",
					"color": "RANDOM",
					"init_perms": [
						"VIEW_AUDIT_LOG"
					]
				}
			}
		}
	},
	// settings for sequelize database connection
	// ignore for now, might add mongodb support if i feel like it
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
