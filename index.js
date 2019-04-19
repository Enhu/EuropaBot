//const declarations
const Discord = require("discord.js");
const client = new Discord.Client();
const config = require("./config.json");
const db = require('./_helpers/database.js')
const sheet = require('./_helpers/googleapi.js')
const { Client } = require('pg');
const ytdl = require('ytdl-core');

//variable declarations
let prefix = config.prefix; //optimize for dynamic prefix SOMEDAY
var roles = [];
var enableGW = false;
var trackingCrew = false;
var crewMemebers = [];
var admins = [];
var sparks = [];

//load server data
(async () => {
  try {
    let table1 = 'roles'
    let table2 = 'sparks'
    roles = await db.selectAllDB(table1);
    sparks = await db.selectAllDB(table2);
  } catch (error) {
    console.log(error);
  }
})()

//connects the bot
client.login(config.token);

//bot logged in successfully and it's ready to be used
client.on("ready", () => {
  console.log(`Ready to server in ${client.channels.size} channels on ${client.guilds.size} servers, for a total of ${client.users.size} users.`);
});

client.on("message", async (message) => {

  //any message done by the bot will return nothing
  if(message.author.bot) return;

  //will only respond if talking in a discord server
  if (!message.guild) return;
  
  //for performance purposes
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/g); //slices the string after the command separated by a space
  const command = args.shift().toLowerCase(); //self explanatory, lower cases the command
  const substr = message.content.substr((prefix + command + " ").length); //the whole string after the command

//
// SELF ASSIGNABLE ROLES
//

  //adds a role to the self assignable roles list
  if(command === "setrole"){
    if(substr != ''){
      (async () =>{
        try {
          let table = "roles";
          if(message.guild.roles.find(role => role.name === substr)){
            if(roles.some(item => item.rolename === substr) && roles.some(item => item.serverid === message.guild.id)){ //checks if the role is already on the list
              return message.channel.send("Role ``" + substr + "`` has already been added to the list.")
            }else{
              let values = {rolename: substr, serverid: message.guild.id}
              const response = await db.insertDB(table, values); //adds the role to the db
              if(response === 'OK'){
                roles = await db.selectAllDB(table); //reloads all the roles
                return message.channel.send("Role ``" + substr + "`` successfully added to the list.")    
              }
            } 
          }
        } catch (error) {
          console.log(error);
        }
      }
      )()
    }else{
      return message.channel.send("```!setrole [role]\nAdds roles to the self-assignable roles list.```"); 
    }
  }

  if(command === "removerole"){
    if(substr != ''){
        (async () => {
          try {
            let table = 'roles';
            let condition = 'rolename';
            if(message.guild.roles.find(role => role.name === substr)){
              if(roles.some(item => item.rolename === substr) && roles.some(item => item.serverid === message.guild.id)){
                const response = await db.deleteDB(table, condition, substr);
                if(response === 'OK'){
                  roles = await db.selectAllDB(table);
                  return message.channel.send("Role ``" + substr + "`` successfully deleted from the self-assignable roles list.")
                }
              }else{
                return message.channel.send("Role ``" + substr + "`` doesn't exist on the list. Add it to the self-assignable roles with !setrole [rolename].")
              } 
          }else{
            return message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles with !setrole [rolename] before using this command.")
          }
            
          } catch (error) {
            console.log(error);
          }
        }
        )()
    }else{
      return message.channel.send("```!removerole [role]\nRemoves roles from the self-assignable roles list.```"); 
    }
  }

  //gives the user a role if they didn't have it and the role is on the list
  if(command === "iam"){
    if(substr != ''){
      let member = message.member;
      if (message.member.roles.find(role => role.name === substr)){
        return message.channel.send("You already have the ``" + substr + "`` role.");
      }else{
          if(roles.some(item => item.rolename === substr)){ //
              let role = message.guild.roles.find(role => role.name === substr);
              member.addRole(role).catch(console.error);
              message.react('☑').then(console.log).catch(console.error);
              return;
          }else{
              if(message.guild.roles.find(role => role.name === substr)){
                  return message.channel.send("I don't have permissions to give this role.");
              }else{
                  return message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles with !setrole [rolename] before using this command.");
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
        return message.channel.send("```csharp\n!iam [role] \nAdd yourself a role if available.\nAvailable roles are: # " + serverRoles.toString().replace(/,/g, ", ") + "\n```"); 
      }else{
        return message.channel.send("```!iam [role] \nAdd yourself a role if available.\nThere no available roles to add. Add roles to the list with !setrole [role]```");
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
              return;
            }else{
              return message.channel.send("You don't have the ``" + substr + "`` role.");
            }
      }else{
          if(message.guild.roles.find(role => role.name === substr)){
            return message.channel.send("I don't have permissions to remove this role. Try adding it to the self-assignable roles list using !setrole [rolename]");
          }else{
            return message.channel.send("I didn't find any role called ``" + substr + "`` on this server. Create the role and then add it to the self-assignable roles list with !setrole [rolename] before using this command.");
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
        return message.channel.send("```csharp\n!iamn [role] \nRemove yourself from a role.\nYour current roles are: # " + userRoles.toString().replace(/,/g, ", ") + "\n```"); 
      }else{
        return message.channel.send("```!iamn [role] \nRemove yourself from a role.\nYou don't have any roles I can remove.```");
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
    if(args.length > 0){
      if(args[0] === 'set'){
        let spark = substr.substring(substr.lastIndexOf(" ") + 1);
        let sparkargs = spark.split(';');
        let crystals = Number(sparkargs[0]);
        let tickets = Number(sparkargs[1]);
        let tenpart = Number(sparkargs[2]);
        let totalDraws;
        let table = 'sparks';
        if(!isNaN(crystals) && !isNaN(tickets) && !isNaN(tenpart)){
          (async () => { 
            totalDraws = Math.floor(crystals / 300) + tickets + (tenpart * 10);
            sparks = await db.selectAllDB(table);
            if(sparks.length > 0 && sparks.some(elem => elem.userid === message.author.id)){          
                try {
                  let values = { crystals: crystals, tickets: tickets, tenpart: tenpart};
                  const response = await db.updateDB(table, message.member.id, values);
                  if(response === 'OK'){
                    return message.channel.send("✅ Spark successfully set. Your current spark funds are: " + crystals + " crystals, " + tickets + " ticket(s) and " + tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws.");
                  }
                } catch (error) {
                    console.log(error); 
                }   
            }else{
                try {
                  let values = { userid: message.author.id, username: message.member.user.username, crystals: crystals, tickets: tickets, tenpart: tenpart };
                  const response = await db.insertDB(table, values);
                  if(response === 'OK'){
                    return message.channel.send("✅ Spark successfully set. Your current spark funds are: " + crystals + " crystals, " + tickets + " ticket(s) and " + tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws.");
                  }      
                }catch (error) {
                  console.log(error);
                }
            }    
          })()
        }
      }
      // TO DO
      if(args[0] === 'add'){
          (async () => {
            let table = 'sparks';
            let condition = 'userid';
            let values = {};
            if(isNaN(Number(args[2]))){
              return;
            }
            const spark = await db.selectDB(table, condition, message.member.id);
            if(spark.length == 0){
              return message.channel.send("❎ You haven't set your spark funds yet!");;
            }
            if(args[1] === 'tix'){              
              values = { userid: message.author.id, tickets: spark[0].tickets + Number(args[2]) };
              const response = await db.updateDB(table, message.author.id, values);
              if(response === 'OK'){
                return message.channel.send("✅ Added " + args[2] + " ticket(s) to the spark fund.");
              }
            }else if(args[1] === 'crystal'){
              values = { userid: message.author.id, crystals: spark[0].crystals + Number(args[2]) };
              const response = await db.updateDB(table, message.author.id, values);
              if(response === 'OK'){
                return message.channel.send("✅ Added " + args[2] + " crystal(s) to the spark fund.");
              }
            }else if(args[1] === '10p'){
              values = { userid: message.author.id, tenpart: spark[0].tenpart + Number(args[2]) };
              const response = await db.updateDB(table, message.author.id, values);
              if(response === 'OK'){
                return message.channel.send("✅ Added " + Number(args[2]) + " 10-part(s) to the spark fund.");
              }       
            }
        })()
      }
      /* maybe do in the future
      if(args[0] === 'sub'){
        if(args[1] === 'tix'){
          
        }else if(args[1] === 'crystal'){
    
        }else if(args[1] === '10p'){
          
        }
      }*/
    
      if(args[0] === 'reset'){
        (async () => {
          try {
            let table = 'sparks';
            let values = { crystals: 0, tickets: 0, tenpart: 0};
            const response = await db.updateDB(table, message.member.id, values);
            if(response === 'OK'){
              return message.channel.send("✅ Spark succesfully reset.");
            }else{
              return message.channel.send("❎ You haven't set your spark funds yet!");
            }
          } catch (error) {
              console.log(error); 
          }
        })()
      }
    }else{
        (async () => {
          try {
            let table = 'sparks'
            let condition = 'userid';
            const spark = await db.selectDB(table, condition, message.member.id);
            if(spark.length == 0){
              return message.channel.send("❎ You haven't set your spark funds yet!");
            }
            let totalDraws = Math.floor(spark[0].crystals / 300) + spark[0].tickets + (spark[0].tenpart * 10);
            return message.channel.send("Your current spark funds are: " + spark[0].crystals + " crystals, " + spark[0].tickets + " ticket(s) and " + spark[0].tenpart + " 10-part draw(s) for a total of " + totalDraws + " draws."); 
          } catch (error) {
            console.log(error);
          }
        })()
    }
}

if(command === 'enablegw'){ //enables all the tracking commands
  if(trackingCrew){
    return message.channel.send("Currently tracking a crew, disable by using !disablegw.");
  }
  enableGW = true;
  return message.channel.send("Guild War tracking enabled."); //Refer to the Guild War section on !help for commands information.
}

if(command === 'disablegw'){ //disables all the tracking commands
  enableGW = false;
  trackingCrew = false;
  crewMemebers = [];
  admins = [];
  return message.channel.send("Guild War tracking disabled.");
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
              return message.channel.send("✅ Now tracking all **" + crewMemebers.length + "** members");    
          }else{
              return message.channel.send("❎ I didn't find any role called ``" + substr + "``, or no users are using this role.");
          }
          
      }else{
        return message.channel.send("```!track [crewRole] \nStarts tracking all the members inside a role.```");
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
                return message.reply('your honor entry has been approved.'); //remove? annoying
              }else {
                return message.reply('your honor entry has been rejected.'); //remove? annoying
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
      return message.channel.send('💬  **Guild Wars results so far...** \n```csharp\n 📋 Rank | Name\n\n' + result + '\n\n```');
    } 
  }

  if(command === 'test'){
    sheet.authorize().then( auth => {
      sheet.listMajors(auth);
    })
  }
}
});

//shows errors on console
client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
client.on("debug", (e) => console.info(e));
