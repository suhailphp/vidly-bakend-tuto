'use strict'

const appConfig = require('../configurations/appConfig.js')
var debug = require('debug')(appConfig.APP_NAME + ':MIDDLEWARE:Error')

module.exports = {
    'catch': () => {

        return async function (error, req, res, next) {
            var isAjaxRequest = req.xhr;

            var url = req.referer || '/'

            debug(Object.keys(error))
            debug(error)

            if (error.name === 'SequelizeValidationError') {

                if (isAjaxRequest)
                    return res.json({success: false, message: error.errors[0].message})

                await req.flashE(error.errors[0].message)
                // await req.flash(modelName, req.body)
                return res.redirect(url)

            }
            else if (error.name === 'SequelizeUniqueConstraintError') {
                debug(error.errors)
                let errM
                if (error.errors[0].type == 'unique violation') {
                    errM = `${error.errors[0].path} is Already Available.`
                } else
                    errM = error.errors[0].message


                if (isAjaxRequest)
                    return res.json({success: false, message: errM})

                await  req.flashE(errM)
                // await req.flash(modelName, req.body)
                return res.redirect(url)

            }
            else if (error.name === 'SequelizeDatabaseError') {

                debug(error.errors)

                let errM = error.message || 'Database Timeout. Please Try Again Later.'

                if (isAjaxRequest)
                    return res.json({success: false, message: errM})

                await req.flashE(errM)
                // await req.flash(modelName, req.body)
                return res.redirect(url)

            } else {
                debug('Sent to APP.js')
                next(error)
            }

        }

    }
}