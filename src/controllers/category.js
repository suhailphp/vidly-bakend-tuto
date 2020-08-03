'use strict'

const appConfig = require('../configurations/appConfig.js')
const debug = require('debug')(appConfig.APP_NAME + ":CONTROLLER-VehicleType.js");
const i18n = require("i18n");
const activeDirectory = require('activedirectory');
const {gatekeeper} = require('../middlewares/index');
const {CreateLogs} = require('../utilities/logs');
const Utils = require('../utilities');
const breadcrumbs = require('../utilities/breadcrumbs');
const moduleName = i18n.__('Category')
const base_url = '/category/';


//for side bar activate class
let currentPage = 'Category';
let mainPage = 'Pharmacy';

module.exports = (Router, Models) => {
    // options are csrfProtection, parseForm

    Router
        .get('/add',
            gatekeeper.authorization(['ADMIN']),
            async (req, res, next) => {


                // let respList = await Models.Category.findAndCountAll()
                // console.log(respList)

                let data = {
                    title: req.__('Add Category'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('Add Category'),
                    currentPage,
                    mainPage,
                    data: {
                        Active: true
                    }
                }

                return res.render('form', data)

            })



    Router
        .get('/',
            gatekeeper.authorization(['ADMIN']),
            async (req, res, next) => {
                let isAjaxRequest = req.xhr;


                try {

                    if (!isAjaxRequest) {

                        let data = {
                            title: req.__('List Category'),
                            breadcrumb: Utils.breadcrumbs.init(__filename, moduleName).add('List Category'),
                            currentPage,
                            mainPage
                        }

                        return res.render('list', data)

                    } else {



                        //debug(req.query)
                        let searchQuery = req.query.search ? req.query.search.value : '';

                        let draw = parseInt(req.query.draw);
                        let start = parseInt(req.query.start);
                        let length = parseInt(req.query.length);

                        let order = req.query.order ? req.query.order[0] : {columns: 'CreatedOn', dir: 'ASC'};
                        let orderCol = 'CreatedOn'
                        switch (parseInt(order.column)) {

                            case 0:
                                orderCol = 'Name' + (req.language == 'ar' ? 'Ar' : 'En')
                                break;
                            case 1:
                                orderCol = Models.Sequelize.literal('UserCreatedBy.FullName' + (req.language == 'ar' ? 'Ar' : 'En'))
                                break;
                            case 2:
                                orderCol = 'CreatedOn'
                                break;
                            case 3:
                                orderCol = 'Active'
                                break;
                        }

                        let where = {
                            $or: [
                                {['Name' + (req.language == 'ar' ? 'Ar' : 'En')]: {$like: '%' + searchQuery + '%'}}
                            ]
                        }


                        let respList = await Models.Category.findAndCountAll(
                            {
                                where,
                                order: [
                                    [orderCol, order['dir']]
                                ],
                                limit: length,
                                offset: start,
                                include: [
                                    {
                                        model: Models.User,
                                        as: 'UserCreatedBy',
                                    }
                                ]
                            })



                      // console.log(respListRow)

                        return res.json({
                            data: respList.rows,
                            "draw": draw,
                            "recordsTotal": respList.count,
                            "recordsFiltered": respList.count,
                        })
                    }
                } catch (e) {
                    next(e)
                }

            })


    Router
        .get('/:CategoryID/edit',
            gatekeeper.authorization(['ADMIN']),
            (req, res, next) => {


                let data = {
                    title: req.__('Update Category'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('Update Category'),
                    currentPage,
                    mainPage
                }
                let where = {
                    CategoryID: req.params.CategoryID
                }


                Models
                    .Category
                    .findOne({
                        where: where
                    })
                    .then(resData=> {
                        if (!resData)
                            // throw new NotFoundError()
                            next(new Error('404'))
                        else {

                            data.data = resData
                            return res.render('form', data)

                        }
                    })
                    .catch(e => {
                        next(e)
                    })

            });
    Router
        .get('/:CategoryID/view',
            gatekeeper.authorization(['ADMIN', 'USER']),
            (req, res, next) => {

                var data = {
                    title: req.__('View Category'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('View Category'),
                    currentPage,
                    mainPage

                }
                let where = {
                    CategoryID: req.params.CategoryID
                }


                Models
                    .Category
                    .findOne({
                        where: where,
                        include: [
                            {
                                model: Models.User,
                                as: 'UserCreatedBy',
                            },
                            {
                                model: Models.User,
                                as: 'UserUpdatedBy',
                            }
                        ]
                    })
                    .then(resData => {
                        if (!resData)
                            // throw new NotFoundError()
                            next(new Error('404'))
                        else {
                            data.data = resData
                            return res.render('view', data)

                        }
                    })
                    .catch(e => {
                        next(e)
                    })

            })

    Router
        .post('/',
            gatekeeper.authorization(['ADMIN']),
            async (req, res, next) => {

                console.log(req.body)

                req.body.Active = req.body.Active || false
                req.body.UserCreatedUserName = req.User.UserName

                let resData = await Models.Category.findOne({where: {CategoryID: req.body.CategoryID}})
                console.log(resData)
                if (resData) {
                    resData.NameEn = req.body.NameEn
                    resData.NameAr = req.body.NameAr
                    resData.Active = req.body.Active
                    resData.UserUpdatedUserName = req.User.UserName

                    await resData.save()
                        .then(async () => {
                            CreateLogs(Models,'category','edit',req.User.UserName,resData.CategoryID);
                            await req.flashS(req.__('Category Updated Successfully.'))
                            return res.redirect(base_url)
                        })
                        .catch(async error => {
                            req.referer = base_url + req.body.CategoryID;
                            await req.flash('Category', req.body)
                            next(error);
                        })
                } else{


                    delete req.body.CategoryID

                    await Models
                        .Category
                        .create(req.body, {validate: true})
                        .then(async function (resData) {
                            CreateLogs(Models,'category','add',req.User.UserName,resData.CategoryID);
                            await req.flashS(req.__('Category Created Successfully.'))
                            return res.redirect(base_url)
                        })
                        .catch(async error => {
                            req.referer = base_url + 'add';
                            await req.flash('Category', req.body)
                            next(error);
                        })

                }

            })



    Router
        .get('/:CategoryID/status',
            gatekeeper.authorization(['ADMIN']),
            (req, res, next) => {


                Models
                    .Category
                    .findOne({
                        where: {
                            CategoryID: req.params.CategoryID
                        }
                    })
                    .then(resData => {

                        if (!resData)
                            return next(new Error(404))


                        resData.Active = !resData.Active
                        resData
                            .save()
                            .then(() => {

                                if(resData.Active){
                                    CreateLogs(Models,'category','enable',req.User.UserName,resData.CategoryID);
                                    req.flashS(req.__('Status Enabled')).then(() => {
                                        res.redirect(base_url)
                                    }).catch(e => {
                                        next(e)
                                    })
                                }
                                else{
                                    CreateLogs(Models,'category','disable',req.User.UserName,resData.CategoryID);
                                    req.flashE(req.__('Status Disabled')).then(() => {
                                        res.redirect(base_url)
                                    }).catch(e => {
                                        next(e)
                                    })
                                }

                            })
                            .catch(e => {
                                next(e)
                            })

                    })

            })

    Router
        .get('/:CategoryID/delete',
            gatekeeper.authorization(['ADMIN']),
            (req, res, next) => {


                Models
                    .Category
                    .findOne({
                        where: {
                            CategoryID: req.params.CategoryID
                        }
                    })
                    .then(resData => {

                        if (!resData)
                            return next(new Error(404))


                        resData.destroy()
                            .then( async ()=>{
                                CreateLogs(Models,'category','delete',req.User.UserName,resData.CategoryID);
                                await req.flashE(req.__('Category Deleted Successfully'))
                                return res.redirect(base_url)
                            })


                    })

            })


    return Router


}