//import some modules

const Discord = require("discord.js");
const Enmap = require("enmap");
const { Message, Client } = require("discord.js");
const colors = require("colors")
var CronJob = require('cron').CronJob;
//define the configuration
const config = require("./config.json")
let countermap = new Map();
//export the Module
module.exports = async (client) => {
    
    //if the bot is ready log it
    client.on("ready", () => {
        var job = new CronJob('0 */10 * * * *', async function () {
            var tempmsgs = client.tempmsgs.get("tempmsgs")
            console.log(String("BEFORE DELETE: " + tempmsgs.length).italic.magenta)
            await tempmsgs.forEach((v, index) => {
                let timeout = config.deletefromcachecooldown;
                if (v.timestamp !== 0 && timeout - (Date.now() - v.timestamp) > 0) {
                    //not to delete, yet
                } else {
                    delete tempmsgs.splice(index, index + 1);
                }
            })
            console.log(String("AFTER DELETE: " + tempmsgs.length).italic.magenta)
            //set the new array
            client.tempmsgs.set("tempmsgs", tempmsgs)
        }, null, true, 'Europe/Berlin');
        job.start();
        console.log(`${client.user.tag} is Online!`.bold.brightGreen)
    });

    //if a message is sent do that
    
client.on('message', async (message) => {
  if(message.content.includes(`<@!`+client.user.id+`>` || `<@`+client.user.id+`>`)) {
    let prefix = config.prefix
    await message.channel.send(new Discord.MessageEmbed()
                    .setColor("#33FF5E")
                    .setTitle(`<:yes:905944886790987796> **To see all Commands type: \`${prefix}help\`**\n**To setup the Global Chat Type: \`${prefix}setup\`**`)
                );
  }
})



    client.on("message", async (message) => {
        //if in a guild or from a Bot return
        if (!message.guild || message.author.bot) return;

        /**
         * @INFO DATABASING
         */
        client.tempmsgs.ensure("tempmsgs", [])
        client.global.ensure(message.author.id, {
            lastmessage: {
                time: 0,
            },
            state: "User",
            messages: 0,
            mutetimestamp: 0,
            mutetime: 0,
            money: 0,
            flags: []
        });
        if (config.botowner.includes(message.author.id)) {
            //NEVER HAVE A COOLDOWN OR LOSE MONEY ;)
            client.global.set(message.author.id, 0, "lastmessage.time")
            client.global.set(message.author.id, 69999999, "money")
            client.global.set(message.author.id, "BOT-OWNER", "state")
        }
        client.global.ensure(message.guild.id, {
            channel: false,
            invite: false
        });
        //get the current data of the guild & user
        let data = client.global.get(message.guild.id);
        let userdata = client.global.get(message.author.id);

        let prefix = config.prefix
        const args = message.content.slice(prefix.length).trim().split(/ +/);
        //creating the cmd argument by shifting the args by 1
        const cmd = args.shift().toLowerCase();
        //if no cmd added return error
        if (cmd.length === 0) {
            if (message.content == `<@${client.user.id}>` || message.content == `<@!${client.user.id}>`)
                return message.channel.send(new Discord.MessageEmbed()
                    .setColor("#33FF5E")
                    .setTitle(`<:yes:905944886790987796> **To see all Commands type: \`${prefix}help\`**\n**To setup the Global Chat Type: \`${prefix}setup\`**`)
                );
        }


        /**
         * @INFO COMMANDS PART
         */
        if (message.content.startsWith(prefix) && cmd.length > 0) {
            if (message.channel.id == client.global.get(message.guild.id, `channel`)) {
                message.delete().catch((O) => {})
                return message.channel.send({ content: `<@${message.author.id}>`, embed: new Discord.MessageEmbed()
                    .setColor("RED")
                    .setDescription("<:no:897849877810274324> **No Commands in here!**")
                }).then(msg => {
                    msg.delete({
                        timeout: 3000
                    }).catch((O) => {})
                })
            }
            if (cmd == "setup") {
                if(!message.member.hasPermission("ADMINISTRATOR"))
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription("<:no:897849877810274324> **You are not allowed to execute this Command!!**"))
                if (!message.guild.me.permissionsIn(message.channel.id).has("CREATE_INSTANT_INVITE"))
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription("<:no:897849877810274324> **I am missing the Permission to create a Server Invite!**"))

                client.global.set(message.guild.id, message.channel.id, `channel`)

                reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **<#${message.channel.id}> is now the Global Channel of this Guild!**`))

                let invitelink = data.invite ? data.invite : config.supportserver;

                if (!client.global.get(message.guild.id, "invite")) {
                    let invite = await message.channel.createInvite({
                        maxAge: 0,
                        unique: true
                    })
                    invitelink = `https://discord.gg/${invite.code}`
                    client.global.set(message.guild.id, invitelink, "invite")
                }

                const embed = new Discord.MessageEmbed()
                    .setColor("#33FF5E")
                    .setAuthor(message.guild.name + `・has joined ${client.user.username}`, message.guild.iconURL({
                        dynamic: true
                    }), invitelink)
                    .setFooter(`${message.guild.id}・${message.guild.memberCount} Members`, message.guild.iconURL({
                        dynamic: true
                    }))
                    .setTimestamp();
                sendallglobal_welcome(embed)
            } else if (cmd == "ping") {
                return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> My ping is ${Date.now() - message.createdTimestamp}ms | API: ${Math.round(client.ws.ping)}`))
            } else if (["bal", "balance", "profile", "me"].includes(cmd)) {
                let user = message.mentions.users.first() || message.author;
                try {
                    let money = client.global.get(user.id, "money")
                    let state = client.global.get(user.id, "state")
                    return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **${user.tag} is a \`${state}\` with \`${money} 💸\`!**\n\n**Flags:**\n> ${String(userdata.flags.length > 0 ? `${userdata.flags.join("・")}`: "No Flags Yet")}`))
                } catch {
                    return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **${user.tag} is a \`User\` with \`0 💸\`!**`))
                }
            } else if (cmd == "support") {
                return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **Join my Support Server**\n> ${config.supportserver}`))
            } else if (cmd == "invite") {
                return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **Invite me to your Server**\n> https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=314433&scope=bot`))
            } else if (cmd == "stats") {
                return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **\`${client.global.filterArray(v => v.channel && v.channel.length === 18).length}\` / \`${client.guilds.cache.size}\` Guilds setup!**`))
            } else if (cmd == "buyflag" || cmd == "flag") {
                let prize = 10000;
                if (!args[0])
                    return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:no:897849877810274324> **You didn't provide a Valid EMOJI\n**\n\nUsage-Example: \`${prefix}buyflag 😍\``))

                const flag = args[0]
                try {
                    message.react(flag)
                        .then(() => {
                            if (prize > userdata.money)
                                return reply(new Discord.MessageEmbed().setColor("RED").setDescription(`<:no:897849877810274324> **You don't have enough Money (\`${userdata.money} 💸\`) to buy ${flag}!**\n***You would need: \`${prize} 💸\`***`))
                            if (userdata.flags.length == 10)
                                return reply(new Discord.MessageEmbed().setColor("RED").setDescription(`<:no:897849877810274324> **You've reached the Maximum Amount of Flags...**`))
                            client.global.push(message.author.id, flag, "flags")
                            return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **Added the Flag ${flag}!**`))
                        })
                        .catch(e => {
                            return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:no:897849877810274324> **You didn't provide a Valid EMOJI\n**\n\nUsage-Example: \`${prefix}buyflag 😍\``))
                        })
                } catch {
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription(`<:no:897849877810274324> **You didn't provided a Valid EMOJI\n**\n\nUsage-Example: \`${prefix}buyflag 😍\``))
                }
            } else if (["store", "info", "shop"].includes(cmd)) {
                return reply(new Discord.MessageEmbed().setColor("#57D1FF")
                .setAuthor(`${client.user.username} • Global-Shop`, `https://cdn.discordapp.com/attachments/897958997385150504/909269777472700524/emoji.png`).setDescription(`<:check:895399572736729148> **JOBS/STATES!**\n\`User\`: \`0 💸 | STANDARD\`\n\`Admin\`: \`X 💸 | UNBUYABLE\`\n\`Fighter\`: \`10000 💸\`\n\`Dancer\`: \`20000 💸\`\n\`Stripper\`: \`30000 💸\`\n\`Vip\`: \`50000 💸\`\n\`Moderator\`: \`75000 💸\`\n\`Big_Vip\`: \`100000 💸\`\n\`Boss\`: \`150000 💸\`\n\`King\`: \`200000 💸\`\n\n**To Buy a Next State/Job/Rank, type:**\n> \`buynextstate\` *... But make sure that you have enough MONEY!*\n\n**FLAGS:** | \`10000 💸\`/Flag\n> *A Flag, is a EMOJI; just add it to the Command, the Emoji you WANT!!!*\n> *It can't be a CUSTOM EMOJI tho, only STANDARD EMOJIS!!!*\n> *It will be listed UNDER your NAME and STATE of each GLOBAL MESSAGE*\n\n**To Buy a Flag, type:**\n> \`buyflag <EMOJI>\` *... But make sure that you have enough MONEY!*
    `).setFooter(`${client.user.username}\nPowered By Vcodez`, client.user.displayAvatarURL()))
            } else if (["buynextstate", "buynextjob", "buynextrank"].includes(cmd)) {
                let prize = 0
                let nextrank = ""
                if (userdata.state == "BOT-OWNER")
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription("<:no:897849877810274324> **You are the BOT-OWNER, you can't buy a Next STATE!**"))
                if (userdata.state == "Admin")
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription("<:no:897849877810274324> **You are an ADMIN, you can't buy a Next STATE!**"))

                if (userdata.state == "Boss")
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription("<:no:897849877810274324> **You are already the King, you can't buy a new State!**"))

                switch (userdata.state) {
                    case "User":
                        prize = 10000;
                        nextrank = "Fighter";
                        break;
                    case "Fighter":
                        prize = 20000;
                        nextrank = "Dancer";
                        break;
                    case "Dancer":
                        prize = 30000;
                        nextrank = "Stripper";
                        break;
                    case "Stripper":
                        prize = 50000;
                        nextrank = "Vip";
                        break;
                    case "Vip":
                        prize = 75000;
                        nextrank = "Moderator";
                        break;
                    case "Moderator":
                        prize = 100000;
                        nextrank = "Big_Vip";
                        break;
                    case "Big_Vip":
                        prize = 150000;
                        nextrank = "Boss";
                        break;
                    case "Boss":
                        prize = 200000;
                        nextrank = "King";
                        break;
                    case "King":
                        prize = 0;
                        nextrank = "";
                        break;
                    default:
                        prize = 0;
                        nextrank = "";
                        break;
                }
                if (prize > userdata.money)
                    return reply(new Discord.MessageEmbed().setColor("RED").setDescription(`<:no:897849877810274324> **You don't have enough Money (\`${userdata.money} 💸\`) to buy ${nextrank}!**\n***You would need: \`${prize} 💸\`***`))

                client.global.set(message.author.id, nextrank, "state")
                client.global.math(message.author.id, "-", prize, "money")

                return reply(new Discord.MessageEmbed().setColor("#57D1FF").setDescription(`<:check:895399572736729148> **You are now an ${nextrank} and have \`${userdata.money} 💸\` left**`))
            } else if (cmd == "help") { // way nicer design of the help-menu, even supports mobile better!
                return reply(new Discord.MessageEmbed().setColor("#57D1FF")
                .setAuthor(`${client.user.username} • Global-Menu`, `https://cdn.discordapp.com/attachments/897958997385150504/909269777472700524/emoji.png`)
                    .setDescription(`<:info:896119462657404929> **__INFORMATION ABOUT THE BOT:__**\n> You can **EDIT** Your Message, and it will **EDIT** the Global Message\n> \n> You can **REPLY** to OTHER USER'S MESSAGES\n> \n> You can delete **YOUR MESSAGE** and the __GLOBAL__ MESSAGE will be DELETED\n> \n> You will be muted if you send too many links!\n> \n> You can buy flags, and jobs, if you've managed to reach **KING** you can buy a custom Color, the Color also Changes on every new JOB!\n\n\n\n<:hydroxuptime:898980349730783292> **__SETTING UP THE GLOBAL-CHAT__**\n> \`${prefix}setup\` .... To Setup the Current Channel as a Global Chat\n\n\n<:vcodezsetting:898980354067660850> **__OTHER COMMANDS__**\n> \`ping\`, \`stats\`, \`support\`, \`invite\`, \`help\` *.... General Bot Information Commands*\n> \n> \`store\`, \`info\`, \`shop\` *.... To Show all available Items/Ranks/Jobs/Flags..*\n> \n> \`buynextjob\`, \`buynextrank\`, \`buynextstate\` *.... To buy the Next State*\n> \n> \`buyflag\`, \`flag\` *.... To buy 1/10 FLAG for \`10000 💸\`*`).setFooter(`${client.user.username}\nPowered By Vcodez`, client.user.displayAvatarURL()))
            }
            return;
        }



        /**
         * @INFO GLOBAL CHAT PART
         */
        let replieduserid;
        let repliedusertag;
        let repliedguildid;
        if (message.channel.id == client.global.get(message.guild.id, `channel`) && !message.system) {
            
            if(((message.content.toLowerCase().includes("discord.gg/")) || isValidURL(message.content)) && userdata.state != "Big_Vip" && userdata.state != "Boss" && userdata.state != "King" && userdata.state != "BOT-OWNER"){
                let key = "Links"+message.author.id
                if (!countermap.get(key)) countermap.set(key, 1)
                
                setTimeout(() => {
                    countermap.set(key, Number(countermap.get(key)) - 1)
                    if (Number(countermap.get(key)) < 0) countermap.set(key, 1)
                }, config.maxlinksinshorttimedeletetime)

                countermap.set(key, Number(countermap.get(key)) + 1)
                
                //react with emojis
                message.react('905944886723895337').catch((O) => {});
                message.react('🔗').catch((O) => {});
                
                //if too many links
                if (Number(countermap.get(key)) > config.maxlinksinshorttime) {
                    reply(new Discord.MessageEmbed()
                        .setColor("ORANGE")
                        .setDescription(`<:check:895399572736729148> \`${message.author.tag}\` got a \`10 Minutes\` **🤐 Global-Mute for \`sending too many LINKS\`**`)
                    );
                    countermap.set(key, 1)
                    client.global.set(message.author.id, Date.now(), "mutetimestamp");
                    client.global.set(message.author.id, 10 * 60 * 1000, "mutetime");
                    
                    return;
                }
                else {
                    message.channel.send({content: `<@${message.author.id}>`, embed: new Discord.MessageEmbed()
                        .setColor("RED")
                        .setDescription(`<:no:897849877810274324> You are not allowed to send Links in this Channel`)
                    }).then(msg => msg.delete({
                        timeout: 3000
                    }).catch(e => console.log("PREVENT BUG")));
                }
                return;
            }
            
            //if the user is on delay return some error
            if (userdata.lastmessage.time !== 0 && config.globalcooldown - (Date.now() - userdata.lastmessage.time) > 0) {
                message.react('905944886723895337').catch((O) => {});
                message.react('⌛').catch((O) => {});
                return;
            }
            //if the user is muted for antilinks
            if (userdata.mutetimestamp !== 0 && userdata.mutetime - (Date.now() - userdata.mutetimestamp) > 0) {
                message.react('905944886723895337').catch((O) => {});
                message.react('🤐').catch((O) => {});
                return;
            }
            //Global Message Embed
            let authorstring = String(userdata.state + "・" + message.author.tag + "・" + nFormatter(userdata.money) + " 💸") + String(userdata.flags.length > 0 ? `\n${userdata.flags.join("・")}` : "");
            
            const embed = new Discord.MessageEmbed()
                .setColor(config.statecolors[userdata.state])
                .setAuthor(authorstring, message.author.displayAvatarURL({
                    dynamic: true,
                    size: 256
                }), data.invite ? data.invite : config.supportserver)
                .setFooter(`${message.guild.name}・${message.guild.memberCount} Members`, message.guild.iconURL({
                    dynamic: true
                }))
                .addField("\u200b", `**[Support Server](${config.supportserver})・[Bot Invite](https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=314433&scope=bot)${data.invite ? `・[Join: ${message.guild.name}](${data.invite})` : ""}**`)
                .setThumbnail(message.author.displayAvatarURL({
                    dynamic: true,
                    size: 256
                }))
                .setTimestamp();
            if (message.content) {
                if (message.reference && message.reference.messageID) {
                    try {
                        let repliedcontent;
                        if (message.channel.messages.cache.get(message.reference.messageID)?.author?.bot) {
                            try {
                                var tempmsgs = client.tempmsgs.get("tempmsgs")
                                let data = tempmsgs[tempmsgs.findIndex(v => v.id == message.reference.messageID)]
                                replieduserid = data.authorid;
                                repliedusertag = data.authortag;
                                repliedcontent = data.content;
                                repliedguildid = data.guildid;
                            } catch {
                                embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                            }
                        } else {
                            try {
                                repliedusertag = message.channel.messages.cache.get(message.reference.messageID)?.author?.tag
                                replieduserid = message.channel.messages.cache.get(message.reference.messageID)?.author?.id
                                repliedcontent = message.channel.messages.cache.get(message.reference.messageID)?.content
                                repliedguildid = message.guild.id;
                            } catch {
                                embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                            }
                        }
                        if (replieduserid && repliedcontent) {
                            try {
                                let userdata2 = client.global.get(replieduserid)
                                let extstr = String("**・\`" + userdata2.state + "\`・\`" + nFormatter(userdata2.money) + " 💸") + "\`**" + String(userdata2.flags.length > 0 ? `\n\`${userdata2.flags.join("・")}\`` : "");
                                embed.setDescription(`<:arrow_right:896722207777120276> **${repliedusertag} ${extstr}:**\n> ${repliedcontent.length > 100 ? String(repliedcontent).substr(0, 90) + " ..." : repliedcontent}\n\n<:arrow_right:896722207777120276> **Message:**\n>>> ` + String(message.content).substr(0, 1800))
                            } catch {
                                embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                            }
                        } else embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                    } catch {
                        embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                    }
                } else {
                    embed.setDescription("<:arrow_right:896722207777120276> **Message:**\n>>> " + String(message.content).substr(0, 2000))
                }
            }
            //define some global variables
            let url = "";
            let imagename = "UNKNOWN";
            //if there is an attachment, add it to the embed
            if (message.attachments.size > 0)
                if (message.attachments.every(attachIsImage)) {
                    const attachment = new Discord.MessageAttachment(url, imagename)
                    embed.attachFiles(attachment);
                    embed.setImage(`attachment://${imagename}`);
                }
            //function to check if an attachment includes a valid image
            function attachIsImage(msgAttach) {
                url = msgAttach.url;
                imagename = msgAttach.name || `Unknown`;
                return url.indexOf("png", url.length - 3) !== -1 || url.indexOf("PNG", url.length - 3) !== -1 ||
                    url.indexOf("jpeg", url.length - 4) !== -1 || url.indexOf("JPEG", url.length - 4) !== -1 ||
                    url.indexOf("gif", url.length - 3) !== -1 || url.indexOf("GIF", url.length - 3) !== -1 ||
                    url.indexOf("webp", url.length - 3) !== -1 || url.indexOf("WEBP", url.length - 3) !== -1 ||
                    url.indexOf("webm", url.length - 3) !== -1 || url.indexOf("WEBM", url.length - 3) !== -1 ||
                    url.indexOf("jpg", url.length - 3) !== -1 || url.indexOf("JPG", url.length - 3) !== -1;
            }
            sendallglobal(embed, message.content ? message.content : "NO CONTENT")
        }


        async function sendallglobal(embed, content) {
            //get the setup channels
            let allglobalchannels = client.global.filter(v => v && v.channel && v.channel.length == 18).map(v => v.channel)
            let notincachechannels = [];
            //reagiere mit globe
            message.react('909181237774680085').catch((O) => {})
            message.delete({
                timeout: config.deletecooldown
            }).catch((O) => {})
            //send the message in this channel
            let MessageObject = {
                embed: embed
            };
            if(replieduserid && repliedguildid && repliedguildid == message.guild.id){
                MessageObject.content = `<:global:909181237774680085> <@${replieduserid}> ***you have gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
            } else if(replieduserid){
                MessageObject.content = `<:global:909181237774680085> **${repliedusertag} *has gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
            }

            message.channel.send(MessageObject).then(msg => {
                client.global.math(message.author.id, "+", Math.floor(Math.random() * 50) + 10, "money");
                client.global.math(message.author.id, "+", 1, "messages");
                client.global.set(message.author.id, Date.now(), "lastmessage.time");
                client.tempmsgs.push("tempmsgs", {
                    originalmessageid: message.id,
                    authorid: message.author.id,
                    channelid: message.channel.id,
                    authortag: message.author.tag,
                    guildid: message.guild.id,
                    timestamp: Date.now(),
                    content: content,
                    id: msg.id,
                });
            }).catch((O) => {console.log(O)})
            //loop through all channels
            for (const chid of allglobalchannels) {
                let channel = client.channels.cache.get(chid);
                if (!channel) {
                    notincachechannels.push(chid);
                    continue;
                }
                if (channel.guild.id != message.guild.id) {
                    if(replieduserid && repliedguildid && repliedguildid == channel.guild.id) {
                        MessageObject.content = `<:global:909181237774680085> <@${replieduserid}> ***you have gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
                    } else if(replieduserid){
                        MessageObject.content = `<:global:909181237774680085> **${repliedusertag} *has gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
                    }
                    channel.send(MessageObject).then(msg => {
                        client.tempmsgs.push("tempmsgs", {
                            originalmessageid: message.id,
                            authorid: message.author.id,
                            channelid: channel.id,
                            authortag: message.author.tag,
                            guildid: message.guild.id,
                            timestamp: Date.now(),
                            content: content,
                            id: msg.id,
                        });
                    }).catch((O) => {})
                }
            }
            //loop through all not cached channels
            for (const chid of notincachechannels) {
                try{
                    let channel = await client.channels.fetch(chid).catch((O) =>{
                        channel = false;
                    });
                    if (!channel) continue;
                    if (channel.guild.id != message.guild.id) {
                        if(replieduserid && repliedguildid && repliedguildid == channel.guild.id) {
                            MessageObject.content = `<:global:909181237774680085> <@${replieduserid}> ***you have gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
                        } else if(replieduserid){
                            MessageObject.content = `<:global:909181237774680085> **${repliedusertag} *has gotten a reply from: \`${message.author.tag}\`, in \`${message.guild.name}\`***`
                        }
                        channel.send(MessageObject).then(msg => {
                            client.tempmsgs.push("tempmsgs", {
                                originalmessageid: message.id,
                                authorid: message.author.id,
                                channelid: channel.id,
                                authortag: message.author.tag,
                                guildid: message.guild.id,
                                timestamp: Date.now(),
                                content: content,
                                id: msg.id,
                            });
                        }).catch((O) => {})
                    }
                }catch{
                    //CHANNEL NOT FOUND
                }
            }
        }
        async function sendallglobal_welcome(embed, content) {
            //get the setup channels
            let allglobalchannels = client.global.filter(v => v && v.channel && v.channel.length == 18).map(v => v.channel)
            let notincachechannels = [];
            //reagiere mit globe
            message.react('909181237774680085').catch((O) => {})
            //send the message in this channel
            let MessageObject = {
                embed: embed
            };
            //loop through all channels
            for (const chid of allglobalchannels) {
                let channel = client.channels.cache.get(chid);
                if (!channel) {
                    notincachechannels.push(chid);
                    continue;
                }
                channel.send(MessageObject)
            }
            //loop through all not cached channels
            for (const chid of notincachechannels) {
                try{
                    let channel = await client.channels.fetch(chid).catch((O) =>{
                        channel = false;
                    });
                    if (!channel) continue;
                    channel.send(MessageObject)
                }catch{
                    //CHANNEL NOT FOUND
                }
            }
        }
        function reply(embed) {
            message.channel.send({ content: `<@${message.author.id}>`, embed: embed}).catch((O) => {})
        }
    });

    client.on("messageUpdate", (oldMessage, newMessage) => {
        //EDIT
        if(oldMessage && newMessage){
            //if it's in the Global Chat area
            client.global.ensure(newMessage.guild.id, {
                channel: false,
                invite: false
            });
            if(newMessage.channel.id == client.global.get(newMessage.guild.id, `channel`)){
                let userdata = client.global.get(newMessage.member.id)
                //IF ITS A LINK THEN RETURN
                if(((newMessage.content.toLowerCase().includes("discord.gg/")) || isValidURL(newMessage.content)) && userdata.state != "Big_Vip" && userdata.state != "Boss" && userdata.state != "King" && userdata.state != "BOT-OWNER"){
                    let keyy = "Links2"+newMessage.member.id;
                    if (!countermap.get(keyy)) 
                      countermap.set(keyy, 1)
                    
                    setTimeout(() => {
                        countermap.set(keyy, Number(countermap.get(keyy)) - 1)
                        if (Number(countermap.get(keyy)) < 0) countermap.set(keyy, 1)
                    }, config.maxlinksinshorttimedeletetime)
    
                    countermap.set(keyy, Number(countermap.get(keyy)) + 1)
                    
                    //react with emojis
                    newMessage.react('897849877810274324').catch((O) => {});
                    newMessage.react('🔗').catch((O) => {});
                    
                    //if too many links
                    if (Number(countermap.get(keyy)) > config.maxlinksinshorttime) {
                        newMessage.channel.send({content: `<@${newMessage.member.id}>`, embed: new Discord.MessageEmbed()
                            .setColor("ORANGE")
                            .setDescription(`<:check:895399572736729148> \`${newMessage.member.user.tag}\` got a \`20 Minutes\` **🤐 Global-Mute for \`sending too many LINKS and trying to edit links for too many times!\`**`)
                        });
                        countermap.set(keyy, 1);
                        client.global.set(newMessage.member.id, Date.now(), "mutetimestamp");
                        client.global.set(newMessage.membermessage.author.id, 20 * 60 * 1000, "mutetime");
                        return;
                    }
                    else {
                        newMessage.channel.send({content: `<@${newMessage.member.id}>`, embed: new Discord.MessageEmbed()
                            .setColor("RED")
                            .setDescription(`<:no:897849877810274324> You are not allowed to send Links in this Channel, and don't try to do it through INVITES!`)
                        }).then(msg => msg.delete({
                            timeout: 5000
                        }).catch(e => console.log("PREVENT BUG")));
                    }
                    return;
                }

                var tempmsgs = client.tempmsgs.get("tempmsgs")
                let datas = tempmsgs.filter(v => v.originalmessageid == newMessage.id)
                for(const data of datas){
                    try{
                        if(!data.channelid) continue;
                        let channel = client.channels.cache.get(data.channelid);
                        let message = channel.messages.cache.get(data.id)
                        let oldembeddesc = message.embeds[0].description.split("<:arrow_right:896722207777120276> **Message:**")
                        let newembeddesc = oldembeddesc[0] + "<:arrow_right:896722207777120276> **Message:**\n>>> " + String(newMessage.content).substr(0, 1800)
                        
                        newEmbed = new Discord.MessageEmbed()
                            .setColor(message.embeds[0].color)
                            .setDescription(newembeddesc)
                            .setAuthor(message.embeds[0].author.name, message.embeds[0].author.iconURL, message.embeds[0].author.url)
                            .setFooter(message.embeds[0].footer.name, message.embeds[0].footer.iconURL)
                            .addField(message.embeds[0].fields[0].name, message.embeds[0].fields[0].value)
                            .setThumbnail(message.embeds[0].thumbnail.url)
                            .setTimestamp(message.embeds[0].timestamp);
                        //if there is an attachment, add it to the embed
                        if (newMessage.attachments.size > 0)
                            if (newMessage.attachments.every(attachIsImage)) {
                                const attachment = new Discord.MessageAttachment(url, imagename)
                                newEmbed.attachFiles(attachment);
                                newEmbed.setImage(`attachment://${imagename}`);
                            }
                        //function to check if an attachment includes a valid image
                        function attachIsImage(msgAttach) {
                            url = msgAttach.url;
                            imagename = msgAttach.name || `Unknown`;
                            return url.indexOf("png", url.length - 3) !== -1 || url.indexOf("PNG", url.length - 3) !== -1 ||
                                url.indexOf("jpeg", url.length - 4) !== -1 || url.indexOf("JPEG", url.length - 4) !== -1 ||
                                url.indexOf("gif", url.length - 3) !== -1 || url.indexOf("GIF", url.length - 3) !== -1 ||
                                url.indexOf("webp", url.length - 3) !== -1 || url.indexOf("WEBP", url.length - 3) !== -1 ||
                                url.indexOf("webm", url.length - 3) !== -1 || url.indexOf("WEBM", url.length - 3) !== -1 ||
                                url.indexOf("jpg", url.length - 3) !== -1 || url.indexOf("JPG", url.length - 3) !== -1;
                        }   
                        message.edit({embed: newEmbed}).catch((O)=>{console.log(O)})
                    }catch (e){
                        console.log(e)
                    }
                }
            }
        }
        function reply(embed) {
            newMessage.channel.send({ content: `<@${newMessage.member.id}>`, embed: embed}).catch((O) => {})
        }
    })

    client.on("messageDelete", (oldMessage) => {
        //if it's in the Global Chat area
        client.global.ensure(oldMessage.guild.id, {
            channel: false,
            invite: false
        });
        if(oldMessage.channel.id == client.global.get(oldMessage.guild.id, `channel`)){
            try{
                var tempmsgs = client.tempmsgs.get("tempmsgs")
                let datas = tempmsgs.filter(v => v.originalmessageid == oldMessage.id).sort((a, b) => {
                    try{
                        return a.timestamp - b.timestamp
                    }catch{

                    }
                })
                for(const data of datas){
                    try{
                        if(!data.channelid) continue;
                        try{
                            if (datas[0].timestamp !== 0 && config.deletecooldown - (Date.now() - datas[0].timestamp) > 1000) {
                                let channel = client.channels.cache.get(data.channelid);
                                let message = channel.messages.cache.get(data.id)
                                message.delete().catch((O)=>{})
                            } else {
                                //don't delete it!
                            }
                        }catch{
                        }
                    }catch (e){
                        console.log(e)
                    }
                }
            }catch{
            }
        }
    })
}

function nFormatter(num, digits = 2) {
    const lookup = [{
            value: 1,
            symbol: ""
        },
        {
            value: 1e3,
            symbol: "k"
        },
        {
            value: 1e6,
            symbol: "M"
        },
        {
            value: 1e9,
            symbol: "G"
        },
        {
            value: 1e12,
            symbol: "T"
        },
        {
            value: 1e15,
            symbol: "P"
        },
        {
            value: 1e18,
            symbol: "E"
        }
    ];
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    var item = lookup.slice().reverse().find(function (item) {
        return num >= item.value;
    });
    return item ? (num / item.value).toFixed(digits).replace(rx, "$1") + item.symbol : "0";
}

function isValidURL(string) {
  const args = string.split(" ");
  let url;
  for(const arg of args){
    try {
      url = new URL(arg);
      url = url.protocol === "http:" || url.protocol === "https:";
      break;
    } catch (_) {
      url = false;
    }
  }
  return url;
};
