'use strict'


/**
 *
 *  Created By Suhail 16/04/2020
 *
 */


const fs = require('fs')
const i18n = require("i18n")
const path = require('path')
const morgan = require('morgan')
const lusca = require('lusca')
const helmet = require('helmet')
const express = require('express')
const favicon = require('serve-favicon')
const Utils = require('./src/utilities/')
const bodyParser = require('body-parser')
let session = require('express-session')
const redisStore = require('connect-redis')(session);
const exphbs = require('express-handlebars')
const appConfig = require('./src/configurations/appConfig.js')
const cookieParser = require('cookie-parser')
const methodOverride = require('method-override')
const middlewares = require('./src/middlewares/index')
const debug = require('debug')(appConfig.APP_NAME + ":APP.JS")

const app = express()
const ENV = appConfig.ENV


/**
 *
 *  Middleware Init
 *
 */


app.set('port', appConfig.PORT);
// app.use(bodyParser.json());
app.use(bodyParser.urlencoded({limit: '50mb', extended: true, parameterLimit: 1000000}));
app.use(methodOverride('X-HTTP-Method'))
app.use(methodOverride('_method'))
app.use(bodyParser.json({type: 'application/json', limit: '50mb'}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(helmet());
app.use(Utils.flash());
i18n.configure({
    locales: ['en', 'ar'],
    //fallbacks: {'en': 'ar'},
    //defaultLocale: 'ar',
    objectNotation: '>>',
    cookie: 'lng',
    directory: __dirname + '/locales',
    autoReload: true,
    api: {
        '__': '__',
        '__n': '__n'
    },
});


/**
 *
 * view engine setup
 *
 */


const hbs = exphbs.create({
    extname: '.hbs',
    defaultLayout: 'default',
    partialsDir: [
        'views/includes/'
    ],
    helpers: Utils.viewHelpers
});
app.set('views', path.join(__dirname, 'views'));
app.set('layoutsDir', path.join(__dirname, 'views/layouts'));
app.engine('.hbs', hbs.engine);
app.set('view engine', '.hbs');
if (ENV === "production")
    app.enable('view cache');

// End View setup

/**
 *  Compression(decrease the size of response body) -- Dont use it with Nginx
 */
app.use(require('compression')());
app.use(lusca.xframe('SAMEORIGIN'));
app.use(lusca.xssProtection(true));
app.use(lusca.nosniff());

app.use(i18n.init);

app.use(favicon(path.join(__dirname, 'public', 'dist/favicon.ico')));


/**
 *
 *  set requests logs
 *
 */


morgan.token('realclfdate', function (req, res) {
    const clfmonth = [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    const pad2 = function (num) {
        const str = String(num);

        return (str.length === 1 ? '0' : '')
            + str;
    };
    const dateTime = new Date();
    const date = dateTime.getDate();
    const hour = dateTime.getHours();
    const mins = dateTime.getMinutes();
    const secs = dateTime.getSeconds();
    const year = dateTime.getFullYear();
    let timezoneofset = dateTime.getTimezoneOffset();
    const sign = timezoneofset > 0 ? '-' : '+';
    timezoneofset = parseInt(Math.abs(timezoneofset) / 60);
    const month = clfmonth[dateTime.getUTCMonth()];

    return pad2(hour) + ':' + pad2(mins) + ':' + pad2(secs)
        + ' ' + sign + pad2(timezoneofset) + '00' + ' : ' +
        pad2(date) + '/' + month + '/' + year;
});
morgan.token('ip', function (req, res) {
    return req.header('x-forwarded-for') || req.ip;
});
morgan.token('userName', function (req, res) {
    return req.User ? req.User.UserName : '';
});
app.use(morgan((ENV === "production" ?
    ':status :method :response-time ms ' +
    'Time | :realclfdate ' +
    'User | :userName ' +
    'Content_Length | :req[content-length] -> :res[content-length] URL | :url  ' +
    'IP |  :ip - :remote-user ' +
    'Agent |   ":referrer" ":user-agent"' :
    'dev'), {
    skip: function (req, res) {
        return res.statusCode == 304 ||
            req.originalUrl.startsWith("/pages/") ||
            req.originalUrl.startsWith("/assets/") ||
            req.originalUrl.startsWith("/plugins/") ||
            req.originalUrl.startsWith("/browser-sync/")
    }
}));

/**
 *
 *   Session Config
 *   Stores in Redis
 *
 */
 session = session({
    name: 'psa-clinic',
    resave: false,
    saveUninitialized: false, // don't create session until something stored
    secret: appConfig.SESSION_SECRET,
    cookie: {maxAge: 30 * 24 * 60 * 60 * 1000},
    store: new redisStore({}),
    expires: true
})
app.use(session);


/**
 *
 *  Database Init
 *
 */


const Models = require('./src/models/')();


/**
 *
 *  Pre Header Init
 *
 */


app.use(function (req, res, next) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    next();
});

app.use(middlewares.gatekeeper.authenticateUser(Models))

/**
 * Cron job for email sending
 */

if ('development' != ENV)
    Utils.cron.start(Models)

/**
 *  Temp files garbage collector
 */
Utils.cron.startGarbageCollector()

app.use(function (req, res, next) {

    if (!req.cookies.lng) {
        req.cookies.lng = 'ar'
        req.language = 'ar'
    }
    i18n.setLocale(req.cookies.lng);

    //res.locals.session = req.session;
    //console.log(req.User.FullNameEn)
    res.locals.USER = req.User;
    res.locals.LNG = req.language;
    res.locals.DIR = req.language == 'ar' ? 'rtl' : 'ltr';
    res.locals.CONFIG = appConfig;
    res.locals.errorMessage = req.flash('errorMessage');
    res.locals.successMessage = req.flash('successMessage');
    res.locals.infoMessage = req.flash('infoMessage');
    res.locals.warningMessage = req.flash('warningMessage');
    const Authorization = require('./src/utilities/authorization')
    if (req.User)
        res.locals.MENU = Authorization.getSideMenu(req.User.UserType, req.url)
    return next();
});


app.use(require('express-status-monitor')());

/**
 *
 *  Routes Init
 *
 */


fs.readdirSync(__dirname + '/src/controllers').forEach(function (file) {

    if (file.substr(-3) == '.js') {

        app.use(
            (
                file.replace('.js', '') === 'index'
                    ?
                    '/'
                    :
                    path.join('/', file.replace('.js', ''))
            )
            ,
            require(__dirname + '/src/controllers/' + file)
            (
                express.Router().use(function (req, res, next) {
                    const _render = res.render;
                    res.render = function (view, options, fn) {
                        let newView = file.replace('.js', '') === 'index' ? ( view) : file.replace('.js', '') + '/' + view
                        if (view.indexOf('error') > -1)
                            newView = 'error'
                        // debug('view', view, 'file', file, 'newView', newView)
                        _render.call(this, newView, options, fn);
                    }
                    next();
                }),
                Models
            )
        );

    }
});


/**
 *
 *
 * Error Handling
 *
 *
 */
app.use(middlewares.error.catch())

//  Next error catch
app.use(function (err, req, res, next) {


    debug(err.name)

    let statusCode
    let message

    switch (err.message) {
        case '404':
        case 'not found':
            statusCode = res.statusCode = 404
            message = 'Page Not Found.'
            break;
        case '401':
            res.statusCode = statusCode = err.message = 401
            message = 'You are not authorized to this page.'
            break;
        default:
            statusCode = 500
            if (ENV === 'production')
                message = err.name + '<br>Something went wrong #AP.1.1'
            else
                message = err.message
            console.error('Error handler called', err);
            break;
    }

    res.locals.error = {
        statusCode: statusCode,
        message: message,
        name: err.name,
        stack: ENV !== 'development' ? null : err.stack || ''
    };

    res.render('error', {layout: 'empty'});

});


// catch 404 and forward to error handler
app.use(function (req, res, next) {

    const err = new Error('Not Found');

    res.locals.error = {
        statusCode: res.statusCode = err.status || 404,
        message: ENV != 'development' ? 'Page not found' : (err.message || 'Something went wrong #AP.2' ),
        stack: ENV != 'development' ? null : (err.stack || '')
    };

    debug(err, req.url)
    res.render('error', {layout: 'empty'});

});


if ('development' == ENV) {

    process.on('uncaughtException', function (err) {

        debug('uncaughtException')
        debug(err)
        console.log("uncaughtException");
        console.log(err);

    });

}


module.exports = app;
