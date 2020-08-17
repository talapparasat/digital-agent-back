import express from 'express';
import serviceCriteriaController from '@controllers/service-criteria';
import {
    superAdminRoleValidator,
    suspendDataValidator,
    isOrganizationRelatedToServiceProviderType,
    isOSPTRelatedToServiceCategory,
    isOSPT_SC_RelatedToServiceCriteria
} from './validators';
import serviceCategoryController from "@controllers/service-category";

const router = express.Router({ mergeParams: true });


router.get('/', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let organizationId = req.params.organizationId;

        const serviceNames = await serviceCriteriaController.getByOrganizationId(organizationId);

        res.status(200).send(serviceNames);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.post('/',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOSPTRelatedToServiceCategory, async (req: any, res: any) => {

    try {

        let {nameKz, nameRu, ospt_scId} = req.body;

        const serviceCategory = await serviceCriteriaController.createAndConnect({nameKz, nameRu}, ospt_scId);

        res.status(200).send(serviceCategory);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:serviceCriteriaId',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOSPTRelatedToServiceCategory, async (req: any, res: any) => {

    try {

        let osptServiceCategoryId = req.body.ospt_scId;
        let serviceCriteriaId = req.params.serviceCriteriaId;

        const serviceCriteria = await serviceCriteriaController.connectToOrganization({
            osptServiceCategoryId,
            serviceCriteriaId
        });

        res.status(200).send(serviceCriteria);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceCriteriaId/suspend',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOSPTRelatedToServiceCategory,
    isOSPT_SC_RelatedToServiceCriteria, async (req: any, res: any) => {

    try {

        let { ospt_sc_scId } = req.body;

        const suspendedRelation = await serviceCriteriaController.suspendRelation(ospt_sc_scId);

        res.status(200).send(suspendedRelation);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;