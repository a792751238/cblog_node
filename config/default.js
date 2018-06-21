const path = require('path');

module.exports = {
    app: {
        name: 'cblog',
        version: '1.0.0'
    },
    publicPath: path.join(__dirname, '../public/dist'),
    uploadPath: path.join(__dirname, '../upload/picture'),
    port: process.env.PORT || 3001,
    session: {
        secret: 'cblog',
        key: 'cblog',
        maxAge: 2592000000
    },
    //mongodb://easterCat:123456@ds062448.mlab.com:62448/mydatabase
    //mongodb://<dbuser>:<dbpassword>@ds062448.mlab.com:62448/mydatabase
    // mongodb: {
    //     host: 'localhost',
    //     port: 27017,
    //     name: 'cblog',
    //     driverOptions: {
    //         poolSize: 100,
    //         reconnectTries: Number.MAX_VALUE,
    //         connectTimeoutMS: 120000,
    //         socketTimeoutMS: 240000
    //     }
    // }
    mongodb: {
        host: 'ds062448.mlab.com',
        port: 62448,
        name: 'mydatabase',
        username: 'easterCat',
        password: '123456',
        driverOptions: {
            poolSize: 100,
            reconnectTries: Number.MAX_VALUE,
            connectTimeoutMS: 120000,
            socketTimeoutMS: 240000
        }
    }
};
