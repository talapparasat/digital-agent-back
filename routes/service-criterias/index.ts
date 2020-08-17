import express from 'express'
import serviceCategoryController from '@controllers/service-category';
import serviceCriteriaController from '@controllers/service-criteria';

import {
    createDataValidator,
    updateDataValidator,
    suspendDataValidator,
    createAndConnectDataValidator,
    isOrganizationRelatedToServiceProviderType,
    superAdminRoleValidator
} from "./validators";
import {pagination} from "./middleware";


const router = express.Router();


router.get('/', pagination, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        const serviceCriterias = await serviceCriteriaController.getByPage(query, page);

        res.status(200).send(serviceCriterias);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/spts/:serviceProviderTypeId', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let serviceProviderTypeId = req.params.serviceProviderTypeId;
        let serviceCategoryId = req.query['categoryId'] ? req.query['categoryId']: '';

        let query = req.query['query'] ? req.query['query'] : '';
        let lang = req.query['lang'] ? req.query['lang']: 'ru';

        const serviceCategory = await serviceCriteriaController.getByServiceProviderType(
            serviceProviderTypeId, serviceCategoryId, query, lang);

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err.message);
    }

});


router.post('/', superAdminRoleValidator, ...createDataValidator, async (req: any, res: any) => {

    try {

        const serviceCategory = await serviceCriteriaController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
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


router.put('/:serviceCriteriaId', superAdminRoleValidator, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const {nameKz, nameRu} = req.body;
        const {serviceCriteriaId} = req.params;

        const updatedServiceCriteria = await serviceCriteriaController.update(serviceCriteriaId, {
            nameKz,
            nameRu,
        });

        res.status(200).send(updatedServiceCriteria);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceCriteriaId/suspend', superAdminRoleValidator, ...suspendDataValidator, async (req: any, res: any) => {

    try {

        const { serviceCriteriaId } = req.params;

        const suspendedServiceCriteria = await serviceCriteriaController.suspend(serviceCriteriaId);

        res.status(200).send(suspendedServiceCriteria);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;