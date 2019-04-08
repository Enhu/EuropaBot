const { Client } = require('pg');
const config = require("../config.json");

const client = new Client({
    connectionString: config.DATABASE_URL,
    ssl: true,
  });

client.connect();

module.exports = {
    selectAllDB : async function(table){
        //connect to postgresql db
        let results;
        const query = "SELECT * FROM " + table + ";"
        await client.query(query)
        .then(res => {
            results = res.rows;
        }).catch(e => {
            console.error(e.stack)
        })
        return results;
    },

    selectDB : async function(table, condition, value){
        //connect to postgresql db
        let results;
        const query = "SELECT * FROM " + table + " WHERE " + condition + " = '" + value + "';"
        await client.query(query)
        .then(res => {
            results = res.rows;
        }).catch(e => {
            console.error(e.stack)
        })  

        return results;
    },
    
    updateDB : async function(table, userid, values){
        var message;
        let update = 'UPDATE ' + table + ' SET ';
        let keys = Object.keys(values);
        let set = [];
        keys.forEach(function (key, i){
            set.push(key + ' = ($' + (i + 1) + ')');
        })
        let queryValues = Object.keys(values).map(function (k) { return values[k]; });
        const query = {
            text: update + set.toString() + " WHERE userid = '" + userid + "';",
            params: queryValues
        }
        await client.query(query.text, query.params)
        .then(res => {
            message = "OK";
        })
        .catch(e => {
            console.error(e.stack)
            message = e.stack;
        })

        return message;
    },
    
    deleteDB : async function(table, condition, value){
        let message;
        const query = "DELETE FROM " + table + " WHERE " + condition + " = '" + value + "';"
        await client.query(query)
        .then(res => {
            message = 'OK';
        }).catch(e => {
            console.error(e.stack)
            message = e.stack;
        })  

        return message;
    },
    
    insertDB : async function(table, values){
        var message;
        let insert = 'INSERT INTO ' + table;
        let keys = Object.keys(values);
        let dollar = keys.map(function (item, index) { return '$' + (index + 1); });
        let queryValues = Object.keys(values).map(function (k) { return values[k]; });
        const query = {
            text: insert + '(' + keys + ')' + ' VALUES(' + dollar + ');',
            params: queryValues
        }
        await client.query(query.text, query.params)
        .then(res => {
            message = "OK";
        })
        .catch(e => {
            console.error(e.stack)
            message = e.stack;
        })

        return message;
    }
}
