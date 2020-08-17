import express from 'express';
import multer from 'multer';
import userController from '@controllers/user';
import {
    isRelatedToOrganization,
    hasPermissionForCreatingOrganizationUsers,
    getDataValidator,
    createDataValidator,
    updateDataValidator,
    isUpdatingUserRelatedToOrganization,
    suspendDataValidator,
    isUserNotConnectedToOrganization,
    addUsersValidator
} from './validators';

import {
    selectUpdatingUserRole,
    upload,
    parsePhone,
    parseUsers,
    validateFile,
} from './middleware';

import { storageConfigs } from "@mw/fileUpload"

const router = express.Router({ mergeParams: true });

router.get('/', ...getDataValidator, isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const autocomplete = !!req.query['autocomplete'];
        const query = req.query['query']?req.query['query']:'';

        const { organizationId } = req.params;

        const users = await userController.getUsersFromOrganization(organizationId, "", autocomplete, query);

        res.status(200).send(users);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.get('/admins', ...getDataValidator, isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const autocomplete = !!req.query['autocomplete'];
        const query = req.query['query']?req.query['query']:'';

        const { organizationId } = req.params;

        const users = await userController.getUsersFromOrganization(organizationId, "admin", autocomplete, query);

        res.status(200).send(users);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/admins/withFree', ...getDataValidator, isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const autocomplete = !!req.query['autocomplete'];
        const query = req.query['query']?req.query['query']:'';

        const { organizationId } = req.params;

        const organizationUsers = await userController.getUsersFromOrganization(organizationId, "admin", autocomplete, query);
        const freeUsers = await userController.getFree("admin");

        res.status(200).send({organizationUsers, freeUsers});

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/supervisors', ...getDataValidator, isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const autocomplete = !!req.query['autocomplete'];
        const query = req.query['query']?req.query['query']:'';

        const { organizationId } = req.params;

        const users = await userController.getUsersFromOrganization(organizationId, "supervisor", autocomplete, query);

        res.status(200).send(users);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/array', addUsersValidator, parseUsers, isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const { organizationId } = req.params;
        const { users } = req.body;

        const newUser = await userController.addArrayToOrganization(organizationId, users);

        res.status(200).send(newUser);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', upload, isRelatedToOrganization, hasPermissionForCreatingOrganizationUsers, async (req: any, res: any) => {

    try {

        const { organizationId } = req.params;
        const { name, email, phone, image, role, position } = req.body;

        const newUser = await userController.createUserForOrganization(organizationId, {name, email, phone, image}, role, position);

        res.status(200).send(newUser);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:userId', isRelatedToOrganization, async (req: any, res: any) => {

    try {

        const { organizationId, userId } = req.params;

        const newUser = await userController.addToOrganization(userId, organizationId);

        res.status(200).send(newUser);

    } catch (err) {
        res.status(400).send(err.message);
    }

});


// router.put('/:userId', ...updateDataValidator, isRelatedToOrganization, isUpdatingUserRelatedToOrganization, selectUpdatingUserRole, hasPermissionForCreatingOrganizationUsers, async (req: any, res: any) => {
//
//     try {
//
//         const { phone } = req.body;
//         const { userId } = req.params;
//
//         const result = await userController.update({
//             userId,
//             phone
//         });
//
//         res.status(200).send(result);
//
//     } catch (err) {
//         res.status(400).send(err);
//     }
//
// });

router.put('/:userId/suspend', ...suspendDataValidator, isRelatedToOrganization, isUpdatingUserRelatedToOrganization, selectUpdatingUserRole, hasPermissionForCreatingOrganizationUsers, async (req: any, res: any) => {

    try {

        const { organizationId, userId } = req.params;

        const result = await userController.suspendRelation(userId, organizationId);

        res.status(200).send(result);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;

