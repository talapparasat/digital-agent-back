import express from 'express';
import navController from "@controllers/nav";
import serviceProviderController from "@controllers/service-provider";
import ERROR, {authErrors} from "@errors";
import isAuth from "@mw/validators/isAuth";

import {
    isOrganizationRelatedToServiceProviderType,
    isOrganizationRelatedToServiceProviderType1,
    superAdminRoleValidator
} from './validators';

import {
    selectOSPT
} from "./middlewares";

const router = express.Router();


// Api для получения списка навигации
// Если передан query string prevId, то возвращает все под навигации текушей навигации, вместе с количеством
// поднавигации в каждом навигации
// Если не передан query string prevId, то возвращает все навигации вместе с вложенными навигациями
router.get('/', async (req: any, res: any) => {

    try {

        let prevId = req.query['prevId'];

        let navs: any;

        if (prevId) {
            prevId = prevId == 'null' ? null : prevId;
            navs = await navController.getByPrevIdWithMaxOrders(prevId);
        } else {
            navs = await navController.getAllWithNestings();
        }

        res.status(200).send(navs);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/max', async (req: any, res: any) => {

    try {

        let prevId = req.query['prevId'];

        let maxOrder = await navController.getMaxOrderByPrevId(prevId);

        res.status(200).send({maxOrder});

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/by-ospt', isOrganizationRelatedToServiceProviderType1, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;
        let prevId = req.query['prevId'];

        let navs: any;

        if (prevId) {
            prevId = prevId == 'null' ? null : prevId;
            navs = await navController.getByOsptAndByPrevId(osptId, prevId);
        } else {
            navs = await navController.getByOspt(osptId);
        }

        res.status(200).send(navs);

    } catch (err) {
        res.status(400).send(err);
    }

});


// Api для мобилки
// Возвращает поднавигации и услугодатели определенной навигаций по ID навигаций, по Id типу услугодателя и по id организаций
// Если organizationId не передан, и этом типе услугодателя только одно организация,  то
// как organizationId берет id этой одной организаций
//
// Если organizationId не передан, и этом типе услугодателя несколько организация,  то
// выдает ошибку
//
// Если ID текущей навигаций не передан возвращает навигаций самого верхного уровня

router.get('/mobile/by-ospt', selectOSPT, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;
        let prevId = req.query['prevId'];

        let serviceProviderTypeId = req.query['serviceProviderTypeId'];
        let organizationId = req.query['organizationId'];

        console.time('navs');
        let navs = await navController.getByOsptAndByPrevId(osptId, prevId);
        console.timeEnd('navs');


        console.time('providers');
        let serviceProviders = await serviceProviderController.getByPrevIdAndOSPT(prevId, serviceProviderTypeId, organizationId);
        console.timeEnd('providers');


        console.time('count');
        let serviceProvidersCount = await serviceProviderController.getCountByServiceProviderType(serviceProviderTypeId);
        console.timeEnd('count');


        res.status(200).send({navigations: navs, serviceProviders, serviceProvidersCount});

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/all', async (req: any, res: any) => {

    try {

        let navs = await navController.getAll();

        res.status(200).send(navs);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/connectArray', superAdminRoleValidator, isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {osptId, navs} = req.body;

        navs = JSON.parse(navs);

        let result = await navController.connectArray(osptId, navs);

        res.status(200).send(result);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


// router.post('/connect/:navId', superAdminRoleValidator, isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {
//
//     try {
//
//         let {osptId} = req.body;
//         let {navId} = req.params;
//
//         let navs = await navController.connect({osptId, navId});
//
//         res.status(200).send(navs);
//
//     } catch (err) {
//         res.status(400).send(err);
//     }
//
// });
//
//
// router.delete('/connect/:navId', superAdminRoleValidator, isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {
//
//     try {
//
//         let {osptId} = req.body;
//         let {navId} = req.params;
//
//         let navs = await navController.removeConnection({osptId, navId});
//
//         res.status(200).send(navs);
//
//     } catch (err) {
//         res.status(400).send(err);
//     }
//
// });


router.post('/', isAuth, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {nameKz, nameRu, order, prevId, coordinates} = req.body;

        coordinates = JSON.parse(req.body.coordinates);

        let nav = await navController.create({nameKz, nameRu, order, prevId, coordinates});

        res.status(200).send(nav);

    } catch (err) {

        console.log(err);
        console.error(err.message);

        res.status(400).send(err);
    }

});


router.put('/:navId', isAuth, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {nameKz, nameRu, order, coordinates} = req.body;
        let {navId} = req.params;

        coordinates = JSON.parse(req.body.coordinates);

        let nav = await navController.update(navId, {nameKz, nameRu, order, coordinates});

        res.status(200).send(nav);

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


router.delete('/:navId', isAuth, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {navId} = req.params;

        let nav = await navController.deleteNav(navId);

        res.status(200).send(nav);

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


router.delete('/:navId/confirmed', isAuth, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {navId} = req.params;

        let to = req.query['to'];
        let setNull = req.query['setNull'];

        let result = await navController.deleteNavConfirm(navId, setNull, to);

        res.status(200).send(result)

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


router.get('/set', isAuth, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let result = await navController.setNavs();

        res.status(200).send(result)

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});

export default router;