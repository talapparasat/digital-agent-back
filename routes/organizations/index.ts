import express from 'express';
import organizationController from '@controllers/organization';
import serviceNameController from '@controllers/service-name';
import organizationServiceProviderTypeController from '@controllers/organization_service-provider-type';
import {
    superAdminRoleValidator,
    getByIdValidator,
    createDataValidator,
    updateDataValidator,
    suspendDataValidator,
    isOrganizationNotHaveServiceNameYet,
    isOrganizationRelatedToServiceProviderType,
} from './validators';

import multer from 'multer';
import {uploadFile, updateFile, pagination} from './middleware';

const router = express.Router();
const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


router.get('/autocomplete', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'] ? req.query['query']: "";

        const organizations = await organizationController.getByQuery(query);

        res.status(200).send(organizations);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/', superAdminRoleValidator, pagination, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        const organizations = await organizationController.getByPage(query, page);

        res.status(200).send(organizations);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/:organizationId', superAdminRoleValidator, ...getByIdValidator, async (req: any, res: any) => {

    try {

        const organization = await organizationController.getById(req.params.organizationId);

        res.status(200).send(organization);

    } catch (err) {
        res.status(400).send(err);
    }


});


router.get('/:organizationId/confirm', superAdminRoleValidator, ...getByIdValidator, async (req: any, res: any) => {

    try {

        const organization = await organizationController.confirm(req.params.organizationId);

        res.status(200).send(organization);

    } catch (err) {
        res.status(400).send(err);
    }


});


router.post('/', multerUpload.single('image'), uploadFile, superAdminRoleValidator, ...createDataValidator, async (req: any, res: any) => {

    try {

        const organization = await organizationController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            image: req.body.image
        });

        res.status(200).send(organization);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:organizationId', multerUpload.single('image'), updateFile, superAdminRoleValidator, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const result = await organizationController.put(req.params.organizationId, {
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            image: req.body.image,
        });

        res.status(200).send(result);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:organizationId/suspend', superAdminRoleValidator, ...suspendDataValidator, async (req: any, res: any) => {

    try {

        const result = await organizationController.suspend(req.params.organizationId);

        res.status(200).send(result);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/:organizationId/service-names', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let organizationId = req.params.organizationId;

        const serviceNames = await serviceNameController.getByOrganizationId(organizationId);

        res.status(200).send(serviceNames);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.delete('/:organizationId/spts/:serviceProviderTypeId', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {organizationId, serviceProviderTypeId} = req.params;
        const serviceProviderTypes = await organizationServiceProviderTypeController.delWithName({
            organizationId,
            serviceProviderTypeId
        });

        res.status(200).send(serviceProviderTypes);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:organizationId/serviceName/:serviceNameId', superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOrganizationNotHaveServiceNameYet, async (req: any, res: any) => {

        try {

            let serviceNameId = req.params.serviceNameId;
            let osptId = req.body.osptId;

            const serviceProviderTypes = await organizationController.addServiceNameToOrganization(osptId, serviceNameId);

            res.status(200).send(serviceProviderTypes);

        } catch (err) {
            res.status(400).send(err);
        }

    });


router.put('/:organizationId/serviceName/:serviceNameId', superAdminRoleValidator,
    isOrganizationNotHaveServiceNameYet, async (req: any, res: any) => {

        try {

            let {organizationId, serviceProviderTypeId} = req.params;
            const serviceProviderTypes = await organizationServiceProviderTypeController.delWithName({
                organizationId,
                serviceProviderTypeId
            });

            res.status(200).send(serviceProviderTypes);

        } catch (err) {
            res.status(400).send(err);
        }

    });


export default router;

