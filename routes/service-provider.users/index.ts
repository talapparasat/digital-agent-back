import express from 'express';

import serviceProviderController from '@controllers/service-provider';
import serviceProviderUsersController from '@controllers/service-provider.users';
import userController from "@controllers/user";
import {ROLES} from "@db/Role";


import {
    addUsersValidator,
    adminSuperAdminRoleValidator,
    getOperatorsWithFreeDataValidator
} from "./validators";
import {
    parseUsers,
    selectUserOrganization,
    selectServiceProviderOrganization
} from "./middleware";

const router = express.Router({ mergeParams: true });

router.get('/operators/withFree', ...getOperatorsWithFreeDataValidator, selectServiceProviderOrganization, async (req: any, res: any) => {

    try {

        const { serviceProviderId } = req.params;
        const { organizationId } = req.body;

        const serviceProviderOperators = await serviceProviderUsersController.getUsersFromServiceProvider(serviceProviderId);
        const freeOperators = await serviceProviderUsersController.getFreeOperators(organizationId);

        res.status(200).send({serviceProviderOperators, freeOperators});

    } catch (err) {
        res.status(400).send(err);
    }

});

router.post('/operators/:userId', adminSuperAdminRoleValidator, selectUserOrganization, async (req: any, res: any) => {

    try {

        const { userId, serviceProviderId } = req.params;
        const { organizationId } = req.body;

        let newServiceProviderUser:any;

        if(req.user.roles.includes(ROLES.ADMIN)) {

        }

        newServiceProviderUser = await userController.connectOperatorToOrganizationAndServiceProvider(organizationId, serviceProviderId, userId);

        res.status(200).send(newServiceProviderUser);

    } catch (err) {
        res.status(400);
    }

});


router.post('/contact-person/arr', async (req: any, res: any) => {

    try {

        const {userId, serviceProviderId} = req.params;

        const newServiceProviderUser = await serviceProviderController.connectContactPerson(serviceProviderId, userId);

        res.status(200).send(newServiceProviderUser);

    } catch (err) {
        res.status(400);
    }

});


router.post('/operator/array', addUsersValidator, parseUsers, async (req: any, res: any) => {

    try {

        const { serviceProviderId } = req.params;
        const { users } = req.body;

        const newUserRelations = await userController.addUsersArrayToServiceProvider(serviceProviderId, users);

        res.status(200).send(newUserRelations);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.post('/supervisor/:userId', async (req: any, res: any) => {

    try {

        const {userId, serviceProviderId} = req.params;

        const newServiceProviderUser = await serviceProviderController.connectToSupervisor(serviceProviderId, userId);

        res.status(200).send(newServiceProviderUser);
    } catch (err) {
        res.status(400);
    }

});


export default router;