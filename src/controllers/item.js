'use strict'

const appConfig = require('../configurations/appConfig.js')
const debug = require('debug')(appConfig.APP_NAME + ":CONTROLLER-VehicleType.js");
const i18n = require("i18n");
const activeDirectory = require('activedirectory');
const {gatekeeper} = require('../middlewares/index');
const {CreateLogs} = require('../utilities/logs');
const Utils = require('../utilities');
const breadcrumbs = require('../utilities/breadcrumbs');
const moduleName = i18n.__('Item')
const base_url = '/Item/';


//for side bar activate class
let currentPage = 'Item';
let mainPage = 'Pharmacy';

module.exports = (Router, Models) => {
    // options are csrfProtection, parseForm

    Router
        .get('/add',
            gatekeeper.authorization(['ADMIN']),
            async (req, res, next) => {


                let Category = await Models.Category.findAll()
                let MedicineType = await Models.MedicineType.findAll()


                let data = {
                    title: req.__('Add Item'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('Add Item'),
                    currentPage,
                    mainPage,
                    data: {
                        Active: true
                    },
                    Category,
                    MedicineType
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
                            title: req.__('List Item'),
                            breadcrumb: Utils.breadcrumbs.init(__filename, moduleName).add('List Item'),
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
                                orderCol = 'CreatedOn'
                                break;
                            case 2:
                                orderCol = Models.Sequelize.literal('UserCreatedBy.FullName' + (req.language == 'ar' ? 'Ar' : 'En'))
                                break;
                            case 3:
                                orderCol = 'CreatedOn'
                                break;
                            case 4:
                                orderCol = 'Active'
                                break;
                        }

                        let where = {
                            $or: [
                                {['Name' + (req.language == 'ar' ? 'Ar' : 'En')]: {$like: '%' + searchQuery + '%'}}
                            ]
                        }


                        let respList = await Models.Item.findAndCountAll(
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

                        //check the quantity
                        let rows = JSON.parse(JSON.stringify(respList.rows))
                        for (let i = 0; i < rows.length; i++) {
                            rows[i].stock = await Utils.stock.getItemStock(Models,rows[i].ItemID);
                        }

                      // console.log(respListRow)

                        return res.json({
                            data: rows,
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
        .get('/:ItemID/edit',
            gatekeeper.authorization(['ADMIN']),
            async (req, res, next) => {


                let Category = await Models.Category.findAll()
                let MedicineType = await Models.MedicineType.findAll()

                let data = {
                    title: req.__('Update Item'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('Update Item'),
                    currentPage,
                    mainPage,
                    Category,
                    MedicineType
                }
                let where = {
                    ItemID: req.params.ItemID
                }


                Models
                    .Item
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
        .get('/:ItemID/view',
            gatekeeper.authorization(['ADMIN', 'USER']),
            (req, res, next) => {

                var data = {
                    title: req.__('View Item'),
                    breadcrumb: breadcrumbs.init(__filename, moduleName).add('View Item'),
                    currentPage,
                    mainPage

                }
                let where = {
                    ItemID: req.params.ItemID
                }


                Models
                    .Item
                    .findOne({
                        where: where,
                        include: [
                            {
                                model: Models.Category,
                                as: 'Category',
                            },
                            {
                                model: Models.MedicineType,
                                as: 'MedicineType',
                            },
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

                //console.log(req.body)

                req.body.Active = req.body.Active || false
                req.body.UserCreatedUserName = req.User.UserName

                let resData = await Models.Item.findOne({where: {ItemID: req.body.ItemID}})
                console.log(resData)
                if (resData) {
                    resData.NameEn = req.body.NameEn
                    resData.NameAr = req.body.NameAr
                    resData.Barcode = req.body.Barcode
                    resData.CategoryID = req.body.CategoryID
                    resData.MedicineTypeID = req.body.MedicineTypeID
                    resData.OpeningStock = req.body.OpeningStock
                    resData.Amount = req.body.Amount
                    resData.Active = req.body.Active
                    resData.UserUpdatedUserName = req.User.UserName

                    await resData.save()
                        .then(async () => {
                            CreateLogs(Models,'item','edit',req.User.UserName,resData.ItemID);
                            await req.flashS(req.__('Item Updated Successfully.'))
                            return res.redirect(base_url)
                        })
                        .catch(async error => {
                            req.referer = base_url + req.body.ItemID;
                            await req.flash('Item', req.body)
                            next(error);
                        })
                } else{


                    delete req.body.ItemID

                    await Models
                        .Item
                        .create(req.body, {validate: true})
                        .then(async function (resData) {
                            CreateLogs(Models,'item','add',req.User.UserName,resData.ItemID);
                            await req.flashS(req.__('Item Created Successfully.'))
                            return res.redirect(base_url)
                        })
                        .catch(async error => {
                            req.referer = base_url + 'add';
                            await req.flash('Item', {data:req.body})
                            next(error);
                        })

                }

            })



    Router
        .get('/:ItemID/status',
            gatekeeper.authorization(['ADMIN']),
            (req, res, next) => {


                Models
                    .Item
                    .findOne({
                        where: {
                            ItemID: req.params.ItemID
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
                                    CreateLogs(Models,'item','enable',req.User.UserName,resData.ItemID);
                                    req.flashS(req.__('Status Enabled')).then(() => {
                                        res.redirect(base_url)
                                    }).catch(e => {
                                        next(e)
                                    })
                                }
                                else{
                                    CreateLogs(Models,'item','disable',req.User.UserName,resData.ItemID);
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
        .get('/:ItemID/delete',
            gatekeeper.authorization(['ADMIN']),
            (req, res, next) => {


                Models
                    .Item
                    .findOne({
                        where: {
                            ItemID: req.params.ItemID
                        }
                    })
                    .then(resData => {

                        if (!resData)
                            return next(new Error(404))


                        resData.destroy()
                            .then( async ()=>{
                                CreateLogs(Models,'item','delete',req.User.UserName,req.params.ItemID);
                                await req.flashE(req.__('Item Deleted Successfully'))
                                return res.redirect(base_url)
                            })


                    })

            })


    return Router


}