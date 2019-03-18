//bot variable declarations
const Discord = require("discord.js");
const discordClient = new Discord.Client();
const config = require("./config.json");
const { Client } = require('pg');

const client = new Client({
  connectionString: config.DATABASE_URL,
  ssl: true,
});

client.connect();

const query = {
  text: 'SELECT * FROM roles;',
}

function loadRoles(){
  client.query(query)
  .then(res => {
    roles = res.rows;
  }).catch(e => {
    console.error(e.stack)
  })
}

loadRoles();

let prefix = config.prefix;
var roles = [];

//connects the bot to the discord users
discordClient.login(config.token);

//bot logged in successfully and it's ready to be used
discordClient.on("ready", () => {
  console.log(`Ready to server in ${discordClient.channels.size} channels on ${discordClient.guilds.size} servers, for a total of ${discordClient.users.size} users.`);
});

discordClient.on("message", (message) => {

  //any message done by the bot will return nothing
  if(message.author.bot) return;
  
  //for performance purposes
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const substr = message.content.substr((prefix + command + " ").length);

  //adds a role to the list so user can self assign them
  if(command === "setrole"){
    if(substr != ''){
      const query = {
        text: 'SELECT * FROM roles;',
      }
      // promise
      client.query(query)
        .then(res => {
          roles = res.rows;
          serverID = message.guild.id;
          if(message.guild.roles.find(role => role.name === substr)){
            if(roles.some(item => item.rolename === substr) && roles.some(item => item.serverid === serverID)){
                message.channel.send("Role ``" + substr + "`` has already been added to the list.")
            }else{
              const text = 'INSERT INTO roles(roleName, serverID) VALUES($1, $2)'
              const values = [substr, serverID]
              
              // promise
              client.query(text, values)
                .then(res => {
                  message.channel.send("Role ``" + substr + "`` successfully added to the list.")
                  loadRoles();
                })
                .catch(e => {
                  console.error(e.stack)
                })
            } 
        }else{
            message.channel.send("I didn't find any role called ``" + substr + "`` on this server.")
        }
        })
        .catch(e => {
          console.error(e.stack)
        })
    }else{
      message.channel.send("```!setrole [role]``` \nAdds roles to the list."); 
    }
  }

  if(command === "removerole"){
    if(substr != ''){
      const query = {
        text: 'SELECT * FROM roles;',
      }
      // promise
      client.query(query)
        .then(res => {
          roles = res.rows;
          serverID = message.guild.id;
          if(message.guild.roles.find(role => role.name === substr)){
            if(roles.some(item => item.rolename === substr) && roles.some(item => item.serverid === serverID)){
              const text = "DELETE FROM roles WHERE roleName='" + substr +"'";
              const values = [substr];
              
              // promise
              client.query(text)
                .then(res => {
                  message.channel.send("Role ``" + substr + "`` successfully deleted from the list.")
                  loadRoles();
                })
                .catch(e => {
                  console.error(e.stack)
                })
                
            }else{
              message.channel.send("Role ``" + substr + "`` doesn't exist on the list. Try adding it with !setrole [role].")
            } 
        }else{
            message.channel.send("I didn't find any role called ``" + substr + "`` on this server.")
        }
        })
        .catch(e => {
          console.error(e.stack)
        })
    }else{
      message.channel.send("```!removerole [role]``` \nRemoves roles from the list."); 
    }
  }

  //gives the user a role if they didn't have it and the role is on the list
  if(command === "iam"){
    if(substr != ''){
      let member = message.member;
      if (message.member.roles.find(role => role.name === substr)){
        message.channel.send("You already have the ``" + substr + "`` role.");
      }else{
          if(roles.some(item => item.rolename === substr)){ //
              let role = message.guild.roles.find(role => role.name === substr);
              member.addRole(role).catch(console.error);
              message.react('☑').then(console.log).catch(console.error);
          }else{
              if(message.guild.roles.find(role => role.name === substr)){
                  message.channel.send("I don't have permissions to give this role.");
              }else{
                  message.channel.send("I didn't find any role called ``" + substr + "`` on this server.");
              }
          }
      }
    }else{
      let serverRoles = [];
      for (let item of roles) {
        if(message.guild.id == item.serverid){
          serverRoles.push(item.rolename);
        }
      }
      if(serverRoles.length > 0){
        message.channel.send("```!iam [role] \nAdd yourself a role if available.\nAvailable roles are: " + serverRoles.toString() + "```"); 
      }else{
        message.channel.send("```!iam [role] \nAdd yourself a role if available.\nThere no available roles to add. Add roles to the list with !setrole [role]```");
      }
      
    }
  }

  //removes the role from a user if they had it and it exists on the list
  if(command === "iamn"){
    if(substr != ''){
      const guildMember = message.member;
      if(roles.some(item => item.rolename === substr)){ //
          if (message.member.roles.find(role => role.name === substr)){
              let role = message.guild.roles.find(role => role.name === substr);
              guildMember.removeRole(role).catch(console.error);
              message.react('☑').then(console.log).catch(console.error);
            }else{
              message.channel.send("You don't have the ``" + substr + "`` role.");
            }
      }else{
          if(message.guild.roles.find(role => role.name === substr)){
              message.channel.send("I don't have permissions to remove this role.");
          }else{
              message.channel.send("I didn't find any role called ``" + substr + "`` on this server.");
          }
      }
    }else{
      let userRoles = [];
      for (let item of roles) {
        if(message.member.roles.find(role => role.name === item.rolename) && message.guild.id == item.serverid){
          userRoles.push(item.rolename);
        }
      }
      if(userRoles.length > 0){
        message.channel.send("```!iamn [role] \nRemove yourself from a role.\nYour current roles are: " + userRoles.toString() + "```"); 
      }else{
        message.channel.send("```!iamn [role] \nRemove yourself from a role.\nYou don't have any roles I can remove.```");
      }
      
    }
  }

  if(command === "help"){
    message.author.send("```Available commands:\n\n!setrole [role]: Allows you to set an auto role.\n!removerole [role]: Allows you to remove an auto role.\n!iam [role]: Allows you to get a role.\n!iamn [role]: Allows you to remove a role.```");
  }
});

//shows errors on console
discordClient.on("error", (e) => console.error(e));
discordClient.on("warn", (e) => console.warn(e));
discordClient.on("debug", (e) => console.info(e));
