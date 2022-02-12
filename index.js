//import some modules

const Discord = require("discord.js");
const Enmap = require("enmap");
const colors = require("colors")
var CronJob = require('cron').CronJob;
//define the configuration
const config = require("./config.json")
//create the client
const client = new Discord.Client({
    fetchAllMembers: false,
    restTimeOffset: 0,
    shards: "auto",
    disableEveryone: true,
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    presence: {
        afk: false,
        activity: {
            name: `Global Chat | ${config.prefix}setup`,
            type: "PLAYING",
            url: "https://twitch.tv/#"
        },
        status: "online"
    }
});
//create the database
client.global = new Enmap({ name: "global" });
client.tempmsgs = new Enmap({ name: "tempmsgs" });
//login the Bot
client.login(process.env.token || config.token);

//REQUIRE EVENTS.js
require("./events")(client)



/*           ANTI CRASHING            ¦¦           ANTI CRASHING           */ 

process.on('unhandledRejection', (reason, p) => {
    console.log('\n\n\n\n\n=== unhandled Rejection ==='.toUpperCase().yellow.dim);
    console.log('Reason: ', reason.stack ? String(reason.stack).gray : String(reason).gray);
    console.log('=== unhandled Rejection ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  });
  process.on("uncaughtException", (err, origin) => {
    console.log('\n\n\n\n\n\n=== uncaught Exception ==='.toUpperCase().yellow.dim);
    console.log('Exception: ', err.stack ? err.stack : err)
    console.log('=== uncaught Exception ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  })
  process.on('uncaughtExceptionMonitor', (err, origin) => {
    console.log('=== uncaught Exception Monitor ==='.toUpperCase().yellow.dim);
  });
  process.on('beforeExit', (code) => {
    console.log('\n\n\n\n\n=== before Exit ==='.toUpperCase().yellow.dim);
    console.log('Code: ', code);
    console.log('=== before Exit ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  });
  process.on('exit', (code) => {
    console.log('\n\n\n\n\n=== exit ==='.toUpperCase().yellow.dim);
    console.log('Code: ', code);
    console.log('=== exit ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  });
  process.on('multipleResolves', (type, promise, reason) => {
    console.log('\n\n\n\n\n=== multiple Resolves ==='.toUpperCase().yellow.dim);
    console.log(type, promise, reason);
    console.log('=== multiple Resolves ===\n\n\n\n\n'.toUpperCase().yellow.dim);
  });