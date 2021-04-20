/**
 * TODO: whitelist channel option
 */

// This is for me (Mindful) testing locally
// "If not in production, load dotenv"
if (!/production/i.test(process.env.NODE_ENV)) {
	require("dotenv").config();
}

const {prefix, token, levels} = require("./config").bot;
const {Client, Collection, MessageEmbed} = require("discord.js");
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
const emojis = {
	backward: "◀",
	forward: "▶"
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
	return client.users.cache.get(matches[1]);
}

function createUsers(){
	let count = 0;
	// i have to fucking rewrite this because of v12
	client.guilds.cache.map((guild, index) => {
		if(!guild.available) return;
		guild.members.cache.map(async (member, index) => {
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
	createUsers();
	const storedExps = await Users.findAll();
	storedExps.forEach(b => users.set(b.user_id, b));
	await client.user.setPresence({
		status: "online",
		activity: {
			name: "Command: _help"
		}
	});
	console.log(`Logged in as ${client.user.tag}!`);
});

client.on("message", async (message) => {
	if(message.author.bot || !message.guild) return;
	if(!message.guild.available) return;
	// exp spam prevention
	if(!timeout.includes(message.member.id)){
		const gainedExp = Math.floor((Math.random() * (25 - 15 + 1)) + 15);
		users.add(message.member.id, "exp", Number(gainedExp));
		client.setTimeout(() => {
			const index = timeout.indexOf(message.member.id);
			if(index > -1) timeout.splice(index, 1);
		}, 1000 * 60);
		timeout.push(message.member.id);
	}

	// idk how this works tbh
	const currentLevel = Math.floor(0.1 * Math.sqrt(users.getInf(message.member.id, "exp")));
	const {roles} = levels;
	if(users.getInf(message.member.id, "level") < currentLevel){
		const user = users.get(message.member.id);
		user.exp = 0;
		user.save();
		users.add(message.member.id, "level", 1);
		const embed = new MessageEmbed()
			.setColor("#5cb85c")
			.setAuthor(message.author.tag, message.author.displayAvatarURL)
			.setImage("https://i.imgur.com/qgpcufH.gif")
			.setDescription(`${message.author.tag} is now level ${currentLevel}!`);
		message.channel.send("", embed);
	}

	if(currentLevel in roles){
		const acquiredRole = message.guild.roles.cache.find(val => val.name === roles[currentLevel].name);
		if(!acquiredRole) acquiredRole = await message.guild.roles.create({
			data: {
				name: roles[currentLevel].name,
				color: roles[currentLevel].color,
				permissions: roles[currentLevel].init_perms
			},
			reason: "Role created for XPCogs"
		});
		message.member.addRole(acquiredRole);
		message.reply(`${message.author} You have acquired the **${acquiredRole.name}** role.`);
	}

	if(!message.content.startsWith(prefix)) return;
	const args = message.content.slice(prefix.length).split(/ +/g);
	const command = args.shift().toLowerCase();
	// if(["ping", "rank", "rankings", "help", "info"].includes(command)) await message.reply(`${message.author}`);

	if(command == "set"){ // set user_id level|exp value
		if(message.author.id !== "***REMOVED***") return message.reply(":middle_finger:");
		if(!args[0] || !args[1] || !args[2]) return message.reply(":thinking:");
		const user = users.get(args[0]);
		if(!user) return message.reply(":thinking:");
		user[args[1]] = parseInt(args[2]);
		user.save();
		return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${args[2]}`);
	}else if(command == "get"){ // get user_id level|exp
		if(message.author.id !== "***REMOVED***") return message.reply(":middle_finger:");
		if(!args[0] || !args[1]) return message.reply(":thinking:");
		const user = users.get(args[0]);
		if(!user) return message.reply(":thinking:");
		return message.reply(`:ok_hand: ${args[0]} > ${args[1]} = ${user[args[1]]}`);
	}else if(command == "ping"){
		const pingMsg = await message.reply("Pinging...");
		return pingMsg.edit(oneLine`
			Pong! :heartpulse: ${pingMsg.createdTimestamp - message.createdTimestamp}ms ||
			${client.ping ? `:heartbeat: ${Math.round(client.ping)}ms.` : ""}
		`);
	}else if(command == "rank"){
		let target = message.author;
		if(args[0]) target = userMentionRegex(args[0]);
		if(!target) return message.reply("That user cannot be found.");
		const rank = [...users.sort((a, b) => (b.level - a.level || b.exp - a.exp)).keys()].indexOf(target.id) + 1;
		const embed = new MessageEmbed()
			.setColor("#5bc0de")
			.setAuthor(target.tag, target.displayAvatarURL)
			.addField("**Rank**", `${rank < 4 ? topRankEmoji[rank] : `:beginner: ${rank}`}`, true)
			.addField("**:large_orange_diamond: Level**", users.getInf(target.id, "level"), true)
			.addField("**:diamond_shape_with_a_dot_inside: EXP**", users.getInf(target.id, "exp"), true);
		return message.reply(embed);
	} else if(command == "rankings"){
		let output = [];
		const chunk = 5;
		users.sort((a, b) => (b.level - a.level || b.exp - a.exp))
			.filter(user => client.users.cache.has(user.user_id))
			.map((user, index) => output.push([
				client.users.cache.get(user.user_id).tag,
				[...users.sort((a, b) => (b.level - a.level || b.exp - a.exp)).keys()].indexOf(user.user_id) + 1, // rank number (hack)
				user.level,
				user.exp
			]));

		output = output.reduce((acc, val, i) => {
			const chunkIndex = Math.floor(i / chunk);
			if (!acc[chunkIndex]) {
				acc[chunkIndex] = [];
			}
			acc[chunkIndex].push(val);
			return acc;
		}, []);

		function createEmbed(page){
			page = page < 1 ? 1 : page;
			page = page > output.length ? output.length : page;
			const embed = new MessageEmbed()
				.setColor("#f7f7f7")
				.setTitle("Rankings")
				.setDescription(`Page ${page} of ${output.length}`);
			output[page - 1].map((val, i) => {
					[name, rank, level, exp] = val;
					embed.addField(`**${rank < 4 ? topRankEmoji[rank] : `:beginner: ${rank}`}  ${name}**`, stripIndents`
						**:large_orange_diamond: Level**: ${level}
						**:diamond_shape_with_a_dot_inside: EXP**: ${exp}
					`, true);
				});
			return embed;
		}

		let page = 1;
		const sentMessage = await message.reply(createEmbed(page));
		await sentMessage.react(emojis.backward);
		await sentMessage.react(emojis.forward);
		const filter = (reaction, user) => {
			return [emojis.backward, emojis.forward].includes(reaction.emoji.name) && user.id === message.author.id;
		};

		// a better one
		async function reactionReactor(reaction){
			const emoji = [reaction.emoji.name, reaction.emoji.id];
			if(emoji.includes(emojis.backward)) page -= 1; // spam protection
			if(emoji.includes(emojis.forward)) page += 1;
			await sentMessage.edit("", createEmbed(page));
		}
		// Using the promise-based collector will only fire the promise exactly once.
		// The user will probably want to move back and forth several times
		// within those sixty seconds, not just once.
		const collector = sentMessage.createReactionCollector(filter, {time: 60 * 1000});
		collector.on("collect", reactionReactor);
		collector.once("end", () => sentMessage.delete()); // delete message to clean the chat
	}else if(command == "help"){
		const msg = stripIndents`
			\`\`\`
			[regular brackets] = optional, user_mention = mentioned user with @ or <@user_id>
			===================
			rank [user_mention] - View a user's rank.
			rankings - View the top 15 users.
			site - View the rankings and bot info on the bot's website. WIP
			info - View info regarding the bot.
			ping - Pong!
			===================
			\`\`\`
		`;
		return message.reply(msg);
	}else if(command == "info"){
		const embed = new MessageEmbed()
			.setColor("#5bc0de")
			.setTitle("Info")
			.setAuthor(client.user.tag, client.user.displayAvatarURL, "https://twitter.com/kairusds")
			.setDescription("Barebones chat levels bot.")
			.addField("**Author**", "HarveyHans (kairusds)", true)
			.addField("**Collaborator**", "MindfulMinun (Benji)", true)
			.addField("**Users**", client.users.cache.size, true)
			.addField("**Server Platform**", process.platform, true);
		message.reply(embed);
	}
});

client.login(token);
