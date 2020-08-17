import express from 'express';
import organizationController from '@controllers/organization';
import serviceNameController from '@controllers/service-name';
import organizationServiceProviderTypeController from '@controllers/organization_service-provider-type';
import {
    superAdminRoleValidator,
    isOrganizationNotHaveServiceNameYet,
    isOrganizationRelatedToServiceProviderType,
    isOSPTRelatedToServiceName
} from './validators';


const router = express.Router({ mergeParams: true });


router.get('/', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let organizationId = req.params.organizationId;

        const serviceNames = await serviceNameController.getByOrganizationId(organizationId);

        res.status(200).send(serviceNames);

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message);
    }

});


router.post('/',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {nameKz, nameRu, code}  = req.body;
        let osptId = req.body.osptId;

        const serviceName = await serviceNameController.createAndConnect({nameKz, nameRu, code}, {osptId});

        res.status(200).send(serviceName);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.post('/:serviceNameId',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOrganizationNotHaveServiceNameYet, async (req: any, res: any) => {

        try {

            let serviceNameId  = req.params.serviceNameId;
            let osptId = req.body.osptId;

            const serviceName = await serviceNameController.connect(osptId, serviceNameId);

            res.status(200).send(serviceName);

        } catch (err) {
            res.status(400).send(err);
        }

    });


// router.put('/:serviceNameId',  superAdminRoleValidator,
//     isOrganizationNotHaveServiceNameYet, async (req: any, res: any) => {
//
//     try {
//
//         let {organizationId, serviceProviderTypeId} = req.params;
//         const serviceProviderTypes = await organizationServiceProviderTypeController.delWithName({organizationId, serviceProviderTypeId});
//
//         res.status(200).send(serviceProviderTypes);
//
//     } catch (err) {
//         res.status(400).send(err);
//     }
//
// });

router.put('/:serviceNameId/suspend',  superAdminRoleValidator,
    isOrganizationRelatedToServiceProviderType, isOSPTRelatedToServiceName, async (req: any, res: any) => {

    try {

        let { ospt_snId } = req.body;
        const suspendedRelation = await serviceNameController.suspendRelation(ospt_snId);

        res.status(200).send(suspendedRelation);

    } catch (err) {
    res.status(400).send(err);
}

});


export default router;
