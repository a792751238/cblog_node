/**
 * Created by easterCat on 2017/10/19.
 */
const path = require('path');
const os = require('os');
const fs = require('fs');
const mongoose = require('mongoose');
const _ = require('lodash');
const Q = require('q');
const Grid = require('gridfs-stream');
const shortid = require('./shortId');
const logger = require('./logger/log');


mongoose.Promise = require('q').Promise;
Grid.mongo = mongoose.mongo;

let config = null;

module.exports = {
    init,
    getConnectURL,
    getDB,
    connect,
    close,
    getFile,
    getFileStream,
    addFile,
    setFile,
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
    url += `${conf.username}:${conf.password}@`;
    url += `${conf.host}:${conf.port}`;
    url += `/${conf.name}`;
    console.log('连接的数据库地址==>', url);
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

// 获取文件到指定的output，可以提供文件名，以及支持分段获取
// 如果不提供output, 下载到临时文件，并返回文件路径
function getFile(id, output, fileName, range) {
    return Q.Promise((resolve, reject) => {
        let failed = false;
        let readstream = getFileStream(id, range);
        readstream.on('error', function (error) {
            failed = true;
            reject(error);
        });
        let savePath = null;
        if (!output) {
            fileName = fileName || id.toString();
            savePath = path.join(os.tmpDir(), fileName);
            output = fs.createWriteStream(savePath);  // Create a file write stream
        }
        output.on('error', function (error) {
            failed = true;
            reject(error);
        });
        output.on('finish', function () {
            if (!failed) {
                resolve(savePath);
            }
        });
        readstream.pipe(output);
    })
}

function getFileStream(id, range) {

    let gfs = new Grid(mongoose.connection.db);
    let readOptions = {
        _id: id
    };
    if (range) readOptions.range = range;
    return gfs.createReadStream(readOptions);
}

function addFile(filePath) {
    let input = fs.createReadStream(filePath);
    return setFile({}, input);
}

function setFile(fileInfo = {}, inputStream) {
    return Q.Promise((resolve, reject) => {
        const fileName = fileInfo.fileName || shortid()

        let gfs = new Grid(mongoose.connection.db)

        let writestream = gfs.createWriteStream({
            filename: fileName,
            metadata: {
                encoding: fileInfo.encoding,
                mimeType: fileInfo.mimeType
            }
        })
        writestream.on('error', function (error) {
            reject(error)
        })
        writestream.on('close', function (file) {
            fileInfo.fileId = file._id
            fileInfo.length = file.length
            fileInfo.md5 = file.md5
            resolve(fileInfo)
        });
        writestream.on('pipe', () => {
        });
        inputStream.on('error', error => {
            reject(error)
        });
        inputStream.pipe(writestream)
    })
}