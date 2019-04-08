//bot variable declarations
const Discord = require("discord.js");
const discordClient = new Discord.Client();
const config = require("./config.json");
const { Client } = require('pg');
const ytdl = require('ytdl-core');

const client = new Client({
  connectionString: config.DATABASE_URL,
  ssl: true,
});

//connect to postgresql db
client.connect();

//load server data (roles for now)
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

//variable declarations
let prefix = config.prefix; //optimize for dynamic prefix
var roles = [];
var enableGW = false;
var trackingCrew = false;
var crewMemebers = [];
var admins = [];
var sparks = [];

//connects the bot
discordClient.login(config.token);

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
        message.channel.send("```csharp\n!iam [role] \nAdd yourself a role if available.\nAvailable roles are: # " + serverRoles.toString().replace(/,/g, ", ") + "\n```"); 
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
        message.channel.send("```csharp\n!iamn [role] \nRemove yourself from a role.\nYour current roles are: # " + userRoles.toString().replace(/,/g, ", ") + "\n```"); 
      }else{
        message.channel.send("```!iamn [role] \nRemove yourself from a role.\nYou don't have any roles I can remove.```");
      }
      
    }
  }

  //direct messages a user for a list of commands
  if(command === "help"){
    message.author.send("```Available commands:\n\n!setrole [role]: Allows you to set an auto role.\n!removerole [role]: Allows you to remove an auto role.\n!iam [role]: Allows you to get a role.\n!iamn [role]: Allows you to remove a role.```");
  }

//
// MUSIC PLAYER
//

//makes the bot join a channel if the user is in the voice channel (rework for permissions)
if (command === 'join') {
  return; //remove
  // only try to join the sender's voice channel if they are in one themselves
  if (message.member.voiceChannel) {
    await message.member.voiceChannel.join();
  } else {
    message.reply('join a voice channel first before using this command.');
  }
}

//makes the bot leave the channel if the user is in the voice channel
if(command === 'leave'){
  return; //remove
  if (message.member.voiceChannel) {
    await message.member.voiceChannel.leave();
  }
}

//play the music 
if(command === 'play'){ //TO FINISH: ADD QUEUE, AWAIT SONG TO FINISH, AUTOMATIC YOUTUBE SEARCH
  if(substr != ''){
    return; //remove
    if (message.member.voiceChannel) {
      if(message.guild.voiceConnection){
        try {
          connection => {
            const stream = ytdl(substr, { filter : 'audioonly' });
            const dispatcher = connection.playStream(stream, streamOptions);
        }
        } catch (error) {
         (console.error);
        }
      }else{
        const streamOptions = { seek: 0, volume: 0.7 };
      message.member.voiceChannel.join()
        .then(connection => {
          const stream = ytdl(substr, { filter : 'audioonly' });
          const dispatcher = connection.playStream(stream, streamOptions);
      })
      .catch(console.error);
      }
      
    }
  }
}

if(command === 'skip'){  //TODO


}

if(command === 'playlist'){ //TODO

}

//
//GBF RELATED CONTENT
//

if(command === 'spark'){
  loadSparks().then(sparks => {
    if(args.length > 0){
      if(args[0] === 'set'){
        let spark = substr.substring(substr.lastIndexOf(" ") + 1);
        let sparkargs = spark.split(';');
        let crystals = Number(sparkargs[0]);
        let tickets = Number(sparkargs[1]);
        let tenpart = Number(sparkargs[2]);
        let totalDraws;
        if(!isNaN(crystals) && !isNaN(tickets) && !isNaN(tenpart)){
          crystals = Math.floor(crystals / 300);
          totalDraws = crystals + tickets + (tenpart * 10);
          if(sparks.length > 0 && sparks.some(elem => elem.userid === message.author.id)){
            const text = "UPDATE sparks SET crystals = ($1), tickets = ($2), tenpart = ($3) WHERE userid = '" + message.member.id + "';"
            const values = [crystals, tickets, tenpart]
            client.query(text, values)
              .then(res => {
                return message.channel.send("✅ Spark set. Your current spark funds are: " + crystals + " crystals, " + tickets + " ticket(s) and " + tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws.");
              })
              .catch(e => {
                console.error(e.stack)
              })
          }else{
            const text = 'INSERT INTO sparks(userid, serverid, username, crystals, tickets, tenpart) VALUES($1, $2, $3, $4, $5, $6)'
            const values = [message.author.id, message.guild.id, message.member.user.username , crystals, tickets, tenpart]
            client.query(text, values)
              .then(res => {
                return message.channel.send("✅ Spark set. Your current spark funds are: " + crystals + " crystals, " + tickets + " ticket(s) and " + tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws.");
              })
              .catch(e => {
                console.error(e.stack)
              })
          }    
        }
      }
    
      /*if(args[0] === 'add'){
        if(args[1] === 'tix'){
    
        }else if(args[1] === 'crystal'){
    
        }else if(args[1] === '10p'){
    
        }
      }
    
      if(args[0] === 'remove'){
        if(args[1] === 'tix'){
    
        }else if(args[1] === 'crystal'){
    
        }else if(args[1] === '10p'){
          
        }
      }*/
    
      if(args[0] === 'reset'){
        
      }
    }else{
        const text = "SELECT * FROM sparks WHERE userid='" + message.member.id +"'";
        client.query(text)
          .then(res => {
            let spark = res.rows;
            let totalDraws = spark[0].crystals + spark[0].tickets + (spark[0].tenpart * 10);
            message.channel.send("Your current spark funds are: " + spark[0].crystals + " crystals, " + spark[0].tickets + " ticket(s) and " + spark[0].tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws.")
          })
          .catch(e => {
            console.error(e.stack)
          })
    }
  }).catch(e => {
    console.error(e.stack)
  });
}

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
          let adminRole = message.guild.roles.find(adminRole => adminRole.name === 'newRole' ) //not intuitive at all
          if(crewRole != undefined && crewRole.members.size > 0){
              for (let member of crewRole.members){
                  crewMemebers = [];
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
          let adminRole = message.guild.roles.find(adminRole => adminRole.name === 'newRole' ) 
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

function loadSparks(){
  return new Promise(resolve => {
    const text = 'SELECT * FROM sparks;';
      client.query(text)
      .then(res => {
        sparks = res.rows;
      }).catch(e => {
        console.error(e.stack)
      })
		setTimeout(() => resolve(sparks), 500);
  });
  
  

}

//shows errors on console
discordClient.on("error", (e) => console.error(e));
discordClient.on("warn", (e) => console.warn(e));
discordClient.on("debug", (e) => console.info(e));
