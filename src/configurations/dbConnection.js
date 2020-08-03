/**
 * Created by Suhail 16/02/2020.
 */

var Sequelize = require('sequelize');
const Op = Sequelize.Op;
const operatorsAliases = {
    $eq: Op.eq,
    $ne: Op.ne,
    $gte: Op.gte,
    $gt: Op.gt,
    $lte: Op.lte,
    $lt: Op.lt,
    $not: Op.not,
    $in: Op.in,
    $notIn: Op.notIn,
    $is: Op.is,
    $like: Op.like,
    $notLike: Op.notLike,
    $iLike: Op.iLike,
    $notILike: Op.notILike,
    $regexp: Op.regexp,
    $notRegexp: Op.notRegexp,
    $iRegexp: Op.iRegexp,
    $notIRegexp: Op.notIRegexp,
    $between: Op.between,
    $notBetween: Op.notBetween,
    $overlap: Op.overlap,
    $contains: Op.contains,
    $contained: Op.contained,
    $adjacent: Op.adjacent,
    $strictLeft: Op.strictLeft,
    $strictRight: Op.strictRight,
    $noExtendRight: Op.noExtendRight,
    $noExtendLeft: Op.noExtendLeft,
    $and: Op.and,
    $or: Op.or,
    $any: Op.any,
    $all: Op.all,
    $values: Op.values,
    $col: Op.col
};
const Config = require('./appConfig')
var debug = require('debug')(Config.APP_NAME+ ':Database Connection')

var dbName = Config.DB.DATABASE
var dbUsername = Config.DB.USERNAME
var dbPassword = Config.DB.PASSWORD
var db = Config.DB.DIALECT
var dbHost = Config.DB.HOST //ip srv-db .29 src-prod1 172.16.1.23
var dbPort = Config.DB.PORT

var db = new Sequelize(dbName, dbUsername, dbPassword, {
    timezone : "+04:00",
    host: dbHost,
    dialect: db,
    port: dbPort,
    define: {
        charset: 'utf8',
        collate: 'utf8_general_ci',
        timestamps: false
    },
    pool: {
        max: 5,
        min: 0,
        idle: 10000
    },
    dialectOptions: {
        encrypt: false
    },
    logging: Config.DB.QUERY_LOG,
    operatorsAliases: operatorsAliases,
    freezeTableName: true // If false the model name will be pluralized eg. User to Users
});


// test connection
db.authenticate()
    .then(function () {
        debug(  dbHost , ' DB Connection has been established successfully.');
        console.log(  dbHost , ' DB Connection has been established successfully.');
    })
    .catch(function (err) {
        debug('Unable to connect to the {' + dbHost + '} database:', err);
        console.error('Unable to connect to the {' + dbHost + '} database:', err);
        process.exit();
    });

module.exports = db;