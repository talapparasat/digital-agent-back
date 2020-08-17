import express from 'express';
import multer from "multer";

import serviceCategoryController from '@controllers/service-category';
import {
    superAdminRoleValidator,
    suspendDataValidator,
    isOrganizationRelatedToServiceProviderType,
    isOSPTRelatedToServiceCategory
} from './validators';

import { uploadFile, updateFile } from "./middleware";

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router({ mergeParams: true });

router.get('/', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let organizationId = req.params.organizationId;

        let serviceProviderTypeId = req.query['serviceProviderTypeId']? req.query['serviceProviderTypeId']:"";

        const serviceNames = await serviceCategoryController.getByOrganizationId(organizationId, serviceProviderTypeId);

        res.status(200).send(serviceNames);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/',  multerUpload.single('image'), uploadFile, superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {nameKz, nameRu, image, osptId} = req.body;
        const serviceCategory = await serviceCategoryController.createAndConnect({nameKz, nameRu, image}, osptId);

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:serviceCategoryId',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let osptId = req.body.osptId;
        let serviceCategoryId = req.params.serviceCategoryId;

        const serviceCategory = await serviceCategoryController.connectToOrganization({
            osptId,
            serviceCategoryId
        });

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceCategoryId/suspend',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOSPTRelatedToServiceCategory, async (req: any, res: any) => {

    try {

        let { ospt_scId } = req.body;

        const serviceCategory = await serviceCategoryController.suspendRelation(ospt_scId);

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;