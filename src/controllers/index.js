'use strict'
const i18n = require("i18n");
const appConfig = require('../configurations/appConfig.js')
const debug = require('debug')(appConfig.APP_NAME + ":telephoneDirectoryRoutes.js");
const gatekeeper = require('../middlewares/gatekeeper');
const breadcrumbs = require('../utilities/breadcrumbs');
const HummusRecipe = require('hummus-recipe');


const moduleName = 'Home';

module.exports = (router, Models) => {

    router
        .all('/', async (req, res, next) => {
            let data = {
                title: req.__('Home'),
                breadcrumb: breadcrumbs.init('', moduleName),
                currentPage:'Home'
            }

            // data.TotalVehicles = await Models.Vehicle.count({where:{Active:true}});
            // data.VehicleOut = await Models.Trip.count({where:{Active:true}});
            // data.VehicleOnWork = await Models.WorkOrder.count({where:{Active:true}});
            // data.VehicleIn = data.TotalVehicles-(data.VehicleOut+data.VehicleOnWork);

            return res.render('index', data);
        });

    return router
}