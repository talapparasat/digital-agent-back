import express from 'express'
import serviceNameController from '@controllers/service-name'
import {
    createDataValidator,
    createAndConnectDataValidator,
    updateDataValidator,
    suspendDataValidator,
    isOrganizationRelatedToServiceProviderType,
    superAdminRoleValidator,
    getAllByPageRoleValidator
} from "./validator";

import {
    pagination
} from './middleware'
import {ROLES} from "@db/Role";


const router = express.Router();

router.get('/', pagination, getAllByPageRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        let serviceNames:any;

        if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
            serviceNames = await serviceNameController.getByPage(query, page);
        } else if(req.user.roles.includes(ROLES.ADMIN)) {
            const organizationId = await req.user.getOrganization();
            if (!organizationId) {
                serviceNames = [];
                return;
            }
            serviceNames = await serviceNameController.getByPageAndByOrganizationId(organizationId['_id'], query, page);
        } else if(req.user.roles.includes(ROLES.SUPERVISOR)) {
            console.log('Supervisor requesting');
            serviceNames = await serviceNameController.getByPageAndBySupervisorsServiceProviders(req.user._id, query, page);
        } else if(req.user.roles.includes(ROLES.OPERATOR)) {
            console.log('Operator requesting');
            serviceNames = await serviceNameController.getByPageAndByServiceProvider(req.user._id, query, page);
        }

        res.status(200).send(serviceNames);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.get('/spts/:serviceProviderTypeId', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'] ? req.query['query'] : '';
        let lang = req.query['lang'] ? req.query['lang']: 'ru';
        const serviceName = await serviceNameController.getByServiceProviderType(
            req.params.serviceProviderTypeId, query, lang);

        res.status(200).send(serviceName);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', superAdminRoleValidator, ...createDataValidator, async (req: any, res: any) => {

    try {

        const serviceName = await serviceNameController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            code: req.body.code
        });

        res.status(200).send(serviceName);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/relate', superAdminRoleValidator, ...createAndConnectDataValidator, isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {
    try {

        const { nameKz, nameRu, code } = req.body;
        const { osptId } = req.body;


        const serviceName = await serviceNameController.createAndConnect(
            { nameKz, nameRu, code},
            { osptId }
            );

        res.status(200).send(serviceName);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.put('/:serviceNameId', superAdminRoleValidator, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const {nameKz, nameRu, code} = req.body;
        const {serviceNameId} = req.params;

        const updatedServiceName = await serviceNameController.update(serviceNameId, {
            nameKz,
            nameRu,
            code
        });

        res.status(200).send(updatedServiceName);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceNameId/suspend', superAdminRoleValidator, ...suspendDataValidator, async (req: any, res: any) => {

    try {

        const { serviceNameId } = req.params;

        const serviceName = await serviceNameController.suspend(serviceNameId);

        res.status(200).send(serviceName);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;