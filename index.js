//bot variable declarations
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");

let prefix = process.env.PREFIX;
var roles = [];
//connects the bot to the discord users
client.login(process.env.BOT_TOKEN);

//bot logged in successfully and it's ready to be used
client.on("ready", () => {
  console.log(`Ready to server in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
});

client.on("message", (message) => {

  //any message done by the bot will return nothing
  if(message.author.bot) return;
  
  //for performance purposes
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  if(command === "setrole"){
    if(message.guild.roles.find(role => role.name === args[0])){
        if(checkForRole(roles, args[0])){
            message.channel.send("Role " + args[0] + " has already been added to the list.")
        }else{
            roles.push(args[0]);
            message.channel.send("Role " + args[0] + " successfully added to the list.")
        } 
    }else{
        message.channel.send("I didn't find any role called " + args[0] + " on this server.")
    }
  }

  //gives the user a role if they didn't have it and the role is on the list
  if(command === "getrole"){
    let member = message.member;
    if (message.member.roles.find(role => role.name === args[0])){
      message.channel.send("You already have the " + args[0] + " role.");
    }else{
        if(checkForRole(roles, args[0])){
            let role = message.guild.roles.find(role => role.name === args[0]);
            member.addRole(role).catch(console.error);
            message.react(message.guild.emojis.get('123456789012345678')).then(console.log).catch(console.error);
        }else{
            if(message.guild.roles.find(role => role.name === args[0])){
                message.channel.send("I don't have permissions to give this role.");
            }else{
                message.channel.send("I didn't find any role called " + args[0] + " on this server.");
            }
        }
    }
  }

  //removes the role from a user if they had it and it exists on the list
  if(command === "removerole"){
    const guildMember = message.member;
    if(checkForRole(roles, args[0])){
        if (message.member.roles.find(role => role.name === args[0])){
            let role = message.guild.roles.find(role => role.name === args[0]);
            guildMember.removeRole(role).catch(console.error);
            message.react(message.guild.emojis.get('123456789012345678')).then(console.log).catch(console.error);
          }else{
            message.channel.send("You don't have the " + args[0] + " role.");
          }
    }else{
        if(message.guild.roles.find(role => role.name === args[0])){
            message.channel.send("I don't have permissions to remove this role.");
        }else{
            message.channel.send("I didn't find any role called " + args[0] + " on this server.");
        }
    }
  }

  function checkForRole(array, val) {
    return array.some(arrVal => val === arrVal);
  }

});

//shows errors on console
client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));
