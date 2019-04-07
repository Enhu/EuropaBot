//bot variable declarations
const Discord = require("discord.js");
const discordClient = new Discord.Client();
const { Client } = require('pg');

const client = new Client({
  connectionString: process.env.DATABASE_URL,
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

let prefix = process.env.PREFIX;
var roles = [];
var enableGW = false;
var trackingCrew = false;
var crewMemebers = [];
var admins = [];

//connects the bot to the discord users
discordClient.login(process.env.BOT_TOKEN);

//bot logged in successfully and it's ready to be used
discordClient.on("ready", () => {
  console.log(`Ready to server in ${discordClient.channels.size} channels on ${discordClient.guilds.size} servers, for a total of ${discordClient.users.size} users.`);
});

discordClient.on("message", async (message) => {

  //any message done by the bot will return nothing
  if(message.author.bot) return;

  //will only respond if talking in a discord server
  if (!message.guild) return;
  
  //for performance purposes
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g);
  const command = args.shift().toLowerCase();
  const substr = message.content.substr((prefix + command + " ").length);

//
// SELF ASSIGNABLE ROLES
//

  //adds a role to the list so user can self assign them
  if(command === "setrole"){
    if(substr != ''){
      const query = {
        text: 'SELECT * FROM roles;',
      }
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
            message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role on the server before using this command.")
        }
        })
        .catch(e => {
          console.error(e.stack)
        })
    }else{
      message.channel.send("```!setrole [role]\nAdds roles to the self-assignable roles list.```"); 
    }
  }

  if(command === "removerole"){
    if(substr != ''){
      const query = {
        text: 'SELECT * FROM roles;',
      }
      client.query(query)
        .then(res => {
          roles = res.rows;
          serverID = message.guild.id;
          if(message.guild.roles.find(role => role.name === substr)){
            if(roles.some(item => item.rolename === substr) && roles.some(item => item.serverid === serverID)){
              const text = "DELETE FROM roles WHERE roleName='" + substr +"'";
              const values = [substr];
              client.query(text)
                .then(res => {
                  message.channel.send("Role ``" + substr + "`` successfully deleted from the self-assignable roles list.")
                  loadRoles();
                })
                .catch(e => {
                  console.error(e.stack)
                })
                
            }else{
              message.channel.send("Role ``" + substr + "`` doesn't exist on the list. Add it to the self-assignable roles with !setrole [rolename].")
            } 
        }else{
            message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles with !setrole [rolename] before using this command.")
        }
        })
        .catch(e => {
          console.error(e.stack)
        })
    }else{
      message.channel.send("```!removerole [role]\nRemoves roles from the self-assignable roles list.```"); 
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
                  message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles with !setrole [rolename] before using this command.");
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
              message.channel.send("I don't have permissions to remove this role. Try adding it to the self-assignable roles list using !setrole [rolename]");
          }else{
            message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles list with !setrole [rolename] before using this command.");
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

  //direct messages a user for a list of commands
  if(command === "help"){
    message.react('☑').then(console.log).catch(console.error);
    message.author.send("```Available commands:\n\n!setrole [role]: Allows you to set a self-assignable role.\n!removerole [role]: Allows you to remove a self-assignable role.\n!iam [role]: Allows you to get a role.\n!iamn [role]: Allows you to remove a role.```");
  }

//
//GBF RELATED CONTENT
// to-do

if(command === 'enablegw'){ //enables all the tracking commands
  if(trackingCrew){
    message.channel.send("Currently tracking a crew, disable by using !disablegw");
    return;
  }
  message.channel.send("Guild War tracking enabled."); //Refer to the Guild War section on !help for commands information.
  enableGW = true;
}

if(command === 'disablegw'){ //disables all the tracking commands
  message.channel.send("Guild War tracking disabled.");
  enableGW = false;
  trackingCrew = false;
  crewMemebers = [];
  admins = [];
}

if(enableGW){
  if(command === 'track'){ //tracks all the people inside a role
      if(substr != ''){
          let crewRole = message.guild.roles.find(crewRole => crewRole.name === substr);
          let adminRole = message.guild.roles.find(adminRole => adminRole.name === 'socks' ) //not intuitive at all
          if(crewRole != undefined && crewRole.members.size > 0){
              crewMemebers = [];
              for (let member of crewRole.members){
                  crewMemebers.push({ id : member[1].id, name : member[1].displayName, honors: 0 }); 
              }
              for (let member of adminRole.members){ //don't do this, learn Map properties
                admins = [];
                admins.push({ id : member[1].id, name : member[1].displayName }); 
              }
              trackingCrew = true;
              message.channel.send("✅ Now tracking all **" + crewMemebers.length + "** members");    
          }else{
              message.channel.send("❌ I didn't find any role called ``" + substr + "``, or no users are using this role.");
          }
          
      }else{
          message.channel.send("```!track [crewRole] \nStarts tracking all the members inside a role.```");
      }
  }

  if(command === 'ss'){
      if(substr != ''){
        if(!isNaN(Number(substr)) && crewMemebers.length > 0){
          let adminRole = message.guild.roles.find(adminRole => adminRole.name === 'socks' ) 
          if(adminRole.members.size > admins.length){
            for (let member of adminRole.members){ //don't do this, learn Map properties
                admins.push({ id : member[1].id, name : member[1].displayName }); 
            }
          }

          message.react('👍').then(() => message.react('👎'));
          const filter = (reaction, user) => {
            return ['👍', '👎'].includes(reaction.emoji.name) && admins.some(member => user.id === member.id); //checks for an admin id
          };

          message.awaitReactions(filter, { max: 1 }) 
            .then(collected => {
              const reaction = collected.first();

              if (reaction.emoji.name === '👍') { //add honors to array
                for (let member of crewMemebers){
                  if(member.id === message.author.id){
                    member.honors = member.honors + Number(substr);
                    crewMemebers.sort((a, b) => (b.honors) - (a.honors));
                  }
                }
                message.reply('your honor entry has been approved.'); //remove? annoying
              }else {
                message.reply('your honor entry has been rejected.'); //remove? annoying
              }
          })
        }
      }
  }

  if(command === 'results'){
    if(crewMemebers.length > 0){
      let result = '';
      let position = 1;
      for(let member of crewMemebers){
        result = result + '[' + position + ']\t  > # ' + member.name + '\n\t\t\t\tTotal Honors: ' + member.honors + '\n'
        position += 1;
      }
      message.channel.send('💬  **Guild Wars results so far...** \n```csharp\n 📋 Rank | Name\n\n' + result + '\n\n```');
    } 
  }
}

});

//shows errors on console
discordClient.on("error", (e) => console.error(e));
discordClient.on("warn", (e) => console.warn(e));
discordClient.on("debug", (e) => console.info(e));