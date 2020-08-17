import express from 'express'
import multer from "multer";

import serviceCategoryController from '@controllers/service-category';

import {
    createDataValidator,
    updateDataValidator,
    suspendDataValidator,
    createAndConnectDataValidator,
    isOrganizationRelatedToServiceProviderType,
    superAdminRoleValidator
} from "./validator";

import { pagination, uploadFile, updateFile } from "./middleware";

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.get('/', pagination, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        const serviceCategories = await serviceCategoryController.getByPage(query, page);

        res.status(200).send(serviceCategories);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/spts/:serviceProviderTypeId', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'] ? req.query['query'] : '';
        let lang = req.query['lang'] ? req.query['lang']: 'ru';

        const serviceCategory = await serviceCategoryController.getByServiceProviderType(
            req.params.serviceProviderTypeId, query, lang);

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', multerUpload.single('image'), uploadFile, superAdminRoleValidator, ...createDataValidator, async (req: any, res: any) => {

    try {

        const serviceCategory = await serviceCategoryController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            image: req.body.image
        });

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});

// router.post('/relate', superAdminRoleValidator, ...createAndConnectDataValidator, isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {
//     try {
//
//         const { nameKz, nameRu } = req.body;
//         const { osptId } = req.body;
//
//
//         const serviceName = await serviceCategoryController.createAndConnect(
//             { nameKz, nameRu },
//             { osptId }
//         );
//
//         res.status(200).send(serviceName);
//
//     } catch (err) {
//         res.status(400).send(err);
//     }
// });


router.put('/:serviceCategoryId', multerUpload.single('image'), updateFile, superAdminRoleValidator, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const {nameKz, nameRu, image} = req.body;
        const {serviceCategoryId} = req.params;

        const updatedServiceCategory = await serviceCategoryController.update(serviceCategoryId, {
            nameKz,
            nameRu,
            image
        });

        res.status(200).send(updatedServiceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceCategoryId/suspend', superAdminRoleValidator, ...suspendDataValidator, async (req: any, res: any) => {

    try {

        const { serviceCategoryId } = req.params;

        const suspendedServiceCategory = await serviceCategoryController.suspend(serviceCategoryId);

        res.status(200).send(suspendedServiceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;