const {prefix, token, levels} = require("./config").bot;
const {Client, Collection, RichEmbed} = require("discord.js");
const client = new Client();
const {Users} = require("./dbObjects");
const {oneLine, stripIndents} = require("common-tags");
const users = new Collection();
const timeout = [];
const topRankEmoji = {
	"1": ":first_place:", "2": ":second_place:", "3": ":third_place:"
};

// restart bot every 12 hours
client.setTimeout(() => {
	console.info("RESTARTING...");
	process.exit(0);
}, 60 * 1000 * 60 * 12);

// original code taken from discordjs.guide examples
// i'll improve this project in the future

Reflect.defineProperty(users, "add", {
	value: async function add(id, key, amount){
		const user = users.get(id);
		if(!user && key == "exp"){
			const newUser = await Users.create({
				user_id: id,
				exp: amount,
				level: 1
			});
			users.set(id, newUser);
			return newUser;
		}
		
		user[key] += Number(amount);
		return user.save();
	}
});

Reflect.defineProperty(users, "get", {
	value: function get(id, key){
		const user = users.get(id);
		return user ? user[key] : 0;
	}
});

function userMentionRegex(mention){
	const matches = mention.match(/^<@!?(\d+)>$/);
	return client.users.get(matches[1]);
}

client.once("ready", async () => {
	const storedExps = await Users.findAll();
	storedExps.forEach(b => users.set(b.user_id, b));
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
	if(message.author.bot || !message.guild) return; // bot not allowed, guild-only
	if(!message.guild.available) return;
	if(!timeout.includes(message.member.id)){
		timeout.push(message.member.id);
		client.setTimeout(() => {
			const index = timeout.indexOf(message.member.id);
			if(index > -1){
				timeout.splice(index, 1);
			}
		}, 1000 * 60);
		users.add(message.member.id, "exp", 1);
		
		const currentLevel = Math.floor(0.1 * Math.sqrt(users.get(message.member.id, "exp")));
		const {roles} = levels;
		if(users.get(message.member.id, "level") < currentLevel){
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
	}

	if(!message.content.startsWith(prefix)) return;
	const args = message.content.slice(prefix.length).split(/ +/g);
	const command = args.shift().toLowerCase();

	switch(command){
		case "set":
			if(!message.author.id === "***REMOVED***") return message.reply(":middle_finger:");
			if(!args[0] || !args[1] || !args[2]) return message.reply(":thinking:");
			let user = users.get(args[0]);
			if(!user) return message.reply(":thinking:");
			user[args[1]] = args[2];
			user.save();
			return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${args[2]}`);
		
		case "get":
			if(!message.author.id === "***REMOVED***") return message.reply(":middle_finger:");
			if(!args[0] || !args[1]) return message.reply(":thinking:");
			let user = users.get(args[0]);
			if(!user) return message.reply(":thinking:");
			return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${user[args[1]]}`);
		
		case "ping":
			const pingMsg = await message.channel.send("Pinging...");
			return pingMsg.edit(oneLine`
				Pong! :heartpulse: ${pingMsg.createdTimestamp - message.createdTimestamp}ms ||
				${client.ping ? `:heartbeat: ${Math.round(client.ping)}ms.` : ""}
			`);
		
		case "rank":
			const target = userMentionRegex(args[0]) || message.author;
			if(!target) return message.channel.send("That user cannot be found.");
			const rank = [...users.keys()].indexOf(target.id); /* users.map((user, position) => {
				if(user.user_id == message.member.id) return position;
			}); */
			const embed = new RichEmbed()
				.setColor("#3CB4FE")
				.setAuthor(target.tag, target.displayAvatarURL)
				.addField("**Rank**", `${rank < 4 ? topRankEmoji[rank + 1] : ":beginner: " + String(rank + 1)}`, true)
				.addField("**:large_orange_diamond: Level**", users.get(target.id, "level"), true)
				.addField("**:diamond_shape_with_a_dot_inside: EXP**", `${users.get(target.id, "exp")}`, true);
			return message.channel.send(embed);
		
		case "rankings":
			const embed = new RichEmbed()
				.setColor("#3CB4FE")
				.setTitle("Rankings");
			users.sort((a, b) => b.exp - a.exp)
				.filter(user => client.users.has(user.user_id))
				.first(15)
				.map((user, position) => embed.addField(`${position < 4 ? topRankEmoji(position + 1) : ":beginner: " + String(position + 1)} ${client.users.get(user.user_id).tag}`, stripIndents`
					:large_orange_diamond: Level: ${user.level}
					:diamond_shape_with_a_dot_inside: EXP: ${user.exp}
				`, true));
			return message.channel.send(embed);
			
		case "help":
			const msg = stripIndents`
				[regular brackets] = optional, user_mention = mentioned user with @ or <@user_id>
				rank [user_mention] - View a user's rank or level.
				rankings - View the top 15 users with the most EXP / highest Level.
				ping - Pong!
			`;
			return message.channel.send(msg, {code: true});
	}
});

client.login(token);