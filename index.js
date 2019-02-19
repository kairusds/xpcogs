// This is for me (Mindful) testing locally
// require('dotenv').config()

const {prefix, token, levels} = require("./config").bot;
const {Client, Collection, RichEmbed} = require("discord.js");
const client = new Client();
const {Users} = require("./dbObjects");
const {oneLine, stripIndents} = require("common-tags");
const users = new Collection();
const timeout = [];
const topRankEmoji = {
	"1": ":first_place:",
	"2": ":second_place:",
	"3": ":third_place:"
};

// restart bot every 12 hours
client.setTimeout(() => {
	console.info("RESTARTING...");
	process.exit(0);
}, 60 * 1000 * 60 * 12);

Reflect.defineProperty(users, "add", {
	value: async (id, key, amount) => {
		const user = users.get(id);
		if (!user) {
			const newUser = await Users.create({
				user_id: id,
				exp: amount,
				level: 0
			});
			users.set(id, newUser);
			return newUser;
		}

		user[key] += Number(amount);
		return user.save();
	}
});

Reflect.defineProperty(users, "getInf", {
	value: (id, key) => {
		const user = users.get(id);
		return user ? user[key] : 0;
	}
});

function userMentionRegex(mention){
	const matches = mention.match(/^<@!?(\d+)>$/);
	return client.users.get(matches[1]);
}

function createUsers(){
	var count = 0;
	// waaw double map
	client.guilds.map((guild, index) => {
		if(!guild.available) return;
		guild.members.map(async (member, index) => {
			if(users.get(member.id) || member.user.bot) return;
			const newUser = await Users.create({
				user_id: member.id,
				exp: 0,
				level: 0
			});
			users.set(member.id, newUser);
			count++;
		});
	});
	console.info(`Inserted ${count} users to the database.`);
}

client.once("ready", async () => {
	const storedExps = await Users.findAll();
	storedExps.forEach(b => users.set(b.user_id, b));
	await client.user.setActivity(`Supple Loli | ${prefix}help`, {type: "WATCHING"});
	createUsers();
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
	if(message.author.bot || !message.guild) return;
	if(!message.guild.available) return;
	// exp spam prevention
	if(!timeout.includes(message.member.id)){
		const gainedExp = Math.floor((Math.random() * (8 - 4 + 1)) + 4);
		users.add(message.member.id, "exp", Number(gainedExp));
		client.setTimeout(() => {
			const index = timeout.indexOf(message.member.id);
			if(index > -1) timeout.splice(index, 1);
		}, 1000 * 45);
		timeout.push(message.member.id);
	}
	
	// 100 exp = level 1, 200 exp = level 2 and so on...
	const currentLevel = Math.floor(0.1 * Math.sqrt(users.getInf(message.member.id, "exp")));
	const {roles} = levels;
	if(users.getInf(message.member.id, "level") < currentLevel){
		const user = users.get(message.member.id);
		user.exp = 0;
		user.save();
		users.add(message.member.id, "level", 1);
		const embed = new RichEmbed()
			.setColor("#3CB4FE")
			.setTitle("Level Up!")
			.setAuthor(message.author.tag, message.author.displayAvatarURL)
			.setDescription(`${message.author.tag} is now level ${currentLevel}!`);
		message.channel.send(embed);
	}

	if(currentLevel in roles){
		const aquiredRole = message.guild.roles.find(val => val.name === roles[currentLevel]);
		message.member.addRole(acquiredRole);
		message.reply(`You have acquired the \"${acquiredRole.name}\" role.`);
	}

	if(!message.content.startsWith(prefix)) return;
	const args = message.content.slice(prefix.length).split(/ +/g);
	const command = args.shift().toLowerCase();

	if(command == "set"){
		if(!message.author.id === "***REMOVED***") return message.reply(":middle_finger:");
		if(!args[0] || !args[1] || !args[2]) return message.reply(":thinking:");
		const user = users.get(args[0]);
		if(!user) return message.reply(":thinking:");
		user[args[1]] = args[2];
		user.save();
		return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${args[2]}`);
	}else if(command == "get"){
		if(!message.author.id === "***REMOVED***") return message.reply(":middle_finger:");
		if(!args[0] || !args[1]) return message.reply(":thinking:");
		const user = users.get(args[0]);
		if(!user) return message.reply(":thinking:");
		return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${user[args[1]]}`);
	}else if(command == "ping"){
		const pingMsg = await message.channel.send("Pinging...");
		return pingMsg.edit(oneLine`
			Pong! :heartpulse: ${pingMsg.createdTimestamp - message.createdTimestamp}ms ||
			${client.ping ? `:heartbeat: ${Math.round(client.ping)}ms.` : ""}
		`);
	}else if(command == "rank"){
		let target = message.author;
		if(args[0]) target = userMentionRegex(args[0]);
		if(!target) return message.channel.send("That user cannot be found.");
		const rank = [...users.sort((a, b) => b.exp - a.exp).keys()].indexOf(target.id);
		const embed = new RichEmbed()
			.setColor("#3CB4FE")
			.setAuthor(target.tag, target.displayAvatarURL)
			.addField("**Rank**", `${rank < 3 ? topRankEmoji[rank + 1] : ":beginner: " + String(rank + 1)}`, true)
			.addField("**:large_orange_diamond: Level**", users.getInf(target.id, "level"), true)
			.addField("**:diamond_shape_with_a_dot_inside: EXP**", users.getInf(target.id, "exp"), true);
		return message.channel.send(embed);
	}else if(command == "rankings"){
		const embed = new RichEmbed()
			.setColor("#3CB4FE")
			.setTitle("Rankings");
		users.sort((a, b) => (b.level + b.exp) - (a.level + a.exp))
			.filter(user => client.users.has(user.user_id))
			.first(15)
			.map((user, position) => embed.addField(`${position < 3 ? topRankEmoji[position + 1] : `:beginner: ${position + 1}`}    ${client.users.get(user.user_id).tag}`, stripIndents`
				:large_orange_diamond: Level: ${user.level}
				:diamond_shape_with_a_dot_inside: EXP: ${user.exp}
			`, true));
		return message.channel.send(embed);
	}else if(command == "help"){
		const msg = stripIndents`
			[regular brackets] = optional, user_mention = mentioned user with @ or <@user_id>
			===================
			rank [user_mention] - View a user's rank or level.
			rankings - View the top 15 users with the most EXP / highest Level.
			info - View info regarding the bot.
			ping - Pong!
			===================
		`;
		return message.channel.send(msg, {code: true});
	}else if(command == "info"){
		const embed = new RichEmbed()
			.setColor("#3CB4FE")
			.setTitle("Info")
			.setAuthor(client.user.tag, client.user.displayAvatarURL, "https://twitter.com/kairusds")
			.addField("Author", "HarveyHans (kairusds)", true)
			.addField("Collaborator", "MindfulMinun (Benji)", true)
			.addField("Users", client.users.size, true)
			.addField("Server Platform", process.platform, true);
		message.channel.send(embed);
	}
});

client.login(token);
