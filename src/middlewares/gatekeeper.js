'use strict';
const appConfig = require('../configurations/appConfig')
var debug = require('debug')(appConfig.APP_NAME + ':GateKeeper')
var SecurityCheck = require('../utilities/securityCheck');
var Notification = require('../utilities/notification');

module.exports.securityCheck = function (req, res, next) {

    SecurityCheck.fixObject(req.body)
    return next();
}


module.exports.authenticateUser = function (Models) {

    return async function (req, res, next) {
        let isAjaxRequest = req.xhr;

        try {
            //debug(req.session)
            if (req.url.indexOf('rurl') >= 0)
                req.rurl = `?rurl=${req.query.rurl}`


            if (req.url.indexOf('/users/login') === 0) {

                return next()

            } else if (req.url.indexOf('/users/logout') === 0) {

                if (req.session.UserName) {
                    delete req.session.UserName
                    await req.flashS('Logout Successful.')
                }
                res.redirect('/users/login' + (req.rurl || ''))


            } else if (req.session.UserName) {

                var where = {
                    userName: req.session.UserName, Active: true
                }

                var userRepo = await  Models.User.findOne({
                    where: where
                })

                if (userRepo) {
                    req.User = userRepo
                    if (userRepo.Language != req.language) {
                        userRepo.Language = req.language === 'en' ? 'en' : 'ar'
                        await userRepo.save()
                    }


                    //req.User.Notification = await Notification.getTop5(Models, req.User.UserName)



                    return next();
                }
                else
                    return res.redirect('/users/logout' + req.query.rurl)


            } else {

                return res.redirect('/users/logout' + `?rurl=${req.url}`)

            }
        } catch (e) {
            next(e)
        }
    }
}

module.exports.authorization = function (allows = []) {

    return function (req, res, next) {
        let flag = false;
        allows.forEach(function (val) {
            if (req.User.UserType == val) {
                flag = true
                return next()
            }
        })
        var isAjaxRequest = req.xhr;
        if (!flag)
            if (!isAjaxRequest)
                return next(new Error(401))
            else
                return res.json({message: 'Unauthorized User.', error: true})

    }
}