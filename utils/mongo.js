/**
 * Created by easterCat on 2017/10/19.
 */
const _ = require('lodash');
const path = require('path');
const os = require('os');
const fs = require('fs');
const mongoose = require('mongoose');

let config = null;

module.exports = {
    init,
    getConnectURL,
    getDB,
    connect,
    close,
};

function init(_config) {
    config = _config;
    const mc = mongoose.connection;
    mc.on('error', error => console.log(`mongoose connection *error* ${error}`));
    mc.on('connecting', () => console.log(`mongoose connection *connecting*`));
    mc.on('connected', () => console.log(`Mongoose connection open to ${config.mongodb.name}`));
    mc.on('reconnected', () => console.log(`mongoose connection *reconnected*`));
    mc.on('fullsetup', () => console.log(`mongoose connection *fullsetup*`));
    mc.on('all', () => console.log(`mongoose connection *all*`));
    mc.on('disconnected', () => console.log(`Mongoose connection disconnected`));
}


function getConnectURL() {
    if (!config) throw 'mongodb config is null';
    const conf = config.mongodb;
    if (!conf) throw  'mongodb config option is error';
    let url = 'mongodb://';
    url += `${conf.host}:${conf.port}`;
    url += `/${conf.name}`;
    return url;
}

function getDB() {
    return mongoose.connection.db;
}

function connect() {
    const url = getConnectURL();
    const options = config.mongodb.driverOptions || {};
    return mongoose.connect(url, _.assign(options, {useMongoClient: true}))
}

function close() {
    mongoose.connection.close();
}

