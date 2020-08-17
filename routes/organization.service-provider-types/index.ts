import express from 'express';
import multer from "multer";

import organizationServiceProviderTypeController from '@controllers/organization_service-provider-type';
import serviceProviderTypeController from '@controllers/service-provider-type';
import {
    superAdminRoleValidator,
    getServiceProviderTypeRoleValidator,
    createDataValidator,
    updateDataValidator,
    connectDataValidator,
    suspendDataValidator,
    isOrganizationNotRelatedToServiceProviderTypeYet,
    isOrganizationRelatedToServiceProviderType
} from './validators';

import { uploadFile, updateFile } from './middleware'

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});

const router = express.Router({ mergeParams: true });


router.get('/',  getServiceProviderTypeRoleValidator, async (req: any, res: any) => {

    try {

        const serviceProviderTypes = await serviceProviderTypeController.getByOrganizationId(req.params.organizationId);

        res.status(200).send(serviceProviderTypes);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});

router.post('/', multerUpload.single('image'), uploadFile, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let { nameKz, nameRu, image } = req.body;

        const serviceProviderType = await serviceProviderTypeController.createAndConnect(
            req.params.organizationId,
            {nameKz, nameRu, image}
        );

        res.status(200).send(serviceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:serviceProviderTypeId', superAdminRoleValidator, ...connectDataValidator, isOrganizationNotRelatedToServiceProviderTypeYet, async (req: any, res: any) => {

    try {

        const organizationServiceProviderType = await serviceProviderTypeController.connect(
            req.params.organizationId,
            req.params.serviceProviderTypeId
        );

        res.status(200).send(organizationServiceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderTypeId/suspend', superAdminRoleValidator, ...suspendDataValidator,
    isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let { osptId } = req.body;

        const organizationServiceProviderType = await serviceProviderTypeController.suspendRelation(osptId);

        res.status(200).send(organizationServiceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;