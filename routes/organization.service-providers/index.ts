import express from 'express';
import organizationServiceProviderTypeController from '@controllers/organization_service-provider-type';
import serviceProviderTypeController from '@controllers/service-provider-type';
import serviceProviderController from '@controllers/service-provider';
import {
    connectRoleValidator,
    connectDataValidator,
    superAdminRoleValidator,
    autocompleteRoleValidator
} from './validators';

import {
    upload,
    validateFile,
    selectAdminOrganization
} from './middleware'

const router = express.Router({mergeParams: true});

router.get('/autocomplete', autocompleteRoleValidator, async (req: any, res: any) => {

    try {

        let query = req.query['query'] ? req.query['query'] : '';
        let {organizationId} = req.params;

        console.log({query, organizationId});

        const serviceProviders = await serviceProviderController.autocomplete(query, organizationId);

        res.status(200).send(serviceProviders);
    } catch (err) {
        res.status(400);
    }
});

router.post('/:serviceProviderId', connectRoleValidator, async (req: any, res: any) => {

    try {

        let { organizationId, serviceProviderId } = req.params;
        let { supervisorId, serviceProviderTypeId, navId} = req.body;

        const serviceProviderType = await serviceProviderController.connectToOrganizationAndSupervisorAndNav(organizationId, supervisorId, serviceProviderTypeId, serviceProviderId, navId);

        res.status(200).send(serviceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;