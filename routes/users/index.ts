import express from 'express'
import multer from "multer";

import userController from '@controllers/user'
import {
    getByIdDataValidator,
    superAdminRoleValidator,
    adminSuperAdminRoleValidator,
    getOperatorsRoleValidator,
    createDataValidator,
    updateDataValidator,
    updateDataMobileValidator,
    suspendDataValidator,
    isRelatedToOrganization,
    hasPermissionForGettingOrganizationUsers,
    hasPermissionForUpdatingOrganizationUsers,
    hasPermissionForSuspendingOrganizationUsers
} from "./validators";

import {
    parsePhone,
    pagination,
    uploadFile,
    updateFile,
    selectUserOrganization
} from "./middleware";

import {ROLES} from "@db/Role";
import {
    hasPermissionForCreatingOrganizationUsers,
} from "@routes/organizations.users/validators";

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.get('/admins', pagination, async (req: any, res: any) => {
    try {

        let query = req.query['query'];
        let page = req.query['page'];

        const serviceProviders = await userController.getAll("admin", query, page);

        res.status(200).send(serviceProviders);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.get('/supervisors', adminSuperAdminRoleValidator, selectUserOrganization, pagination, async (req: any, res: any) => {
    try {

        let query = req.query['query'];
        let page = req.query['page'];
        let {organizationId} = req.body;

        const serviceProviders = await userController.getAll(ROLES.SUPERVISOR, query, page, organizationId);

        res.status(200).send(serviceProviders);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.get('/operators', getOperatorsRoleValidator, selectUserOrganization, pagination, async (req: any, res: any) => {
    try {

        let query = req.query['query'];
        let page = req.query['page'];
        let {organizationId} = req.body;

        let operators: any;

        if (req.user.roles.includes(ROLES.SUPER_ADMIN) || req.user.roles.includes(ROLES.ADMIN)) {
            operators = await userController.getAll(ROLES.OPERATOR, query, page, organizationId);

        } else if (req.user.roles.includes(ROLES.SUPERVISOR)) {
            operators = await userController.getOperatorsBySupervisor(query, page, req.user._id);

        }

        res.status(200).send(operators);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.get('/admins/free', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        const serviceProviders = await userController.getFree("admin");

        res.status(200).send(serviceProviders);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/:userId', ...getByIdDataValidator, hasPermissionForGettingOrganizationUsers, async (req: any, res: any) => {

    try {

        let {userId} = req.params;

        const user = await userController.getById(userId);

        res.status(200).send(user);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/:userId/confirm', isRelatedToOrganization, async (req: any, res: any) => {
    try {

        console.log({userConfirm: req.params.userId});
        const serviceProviders = await userController.getByIdWithOrganization(req.params.userId);

        res.status(200).send(serviceProviders);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }
});


router.get('/:userId/confirmOperator', ...getByIdDataValidator, hasPermissionForGettingOrganizationUsers, async (req: any, res: any) => {
    try {


        const userConfirm = await userController.getByIdWithOrganizationAndServiceProvider(req.params.userId);

        console.log("userConfirm", userConfirm);
        res.status(200).send(userConfirm);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.post('/', multerUpload.single('image'), isRelatedToOrganization, hasPermissionForCreatingOrganizationUsers, uploadFile, parsePhone, ...createDataValidator, async (req: any, res: any) => {

    try {
        let newUser: any;

        if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
            newUser = await userController.createUser({
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    image: req.body.image,
                },
                req.body.role,
                req.body.position);
        } else if (req.user.roles.includes(ROLES.ADMIN)) {
            console.log("admin");

            newUser = await userController.createUserForOrganization(
                req.body.organizationId,
                {
                    name: req.body.name,
                    email: req.body.email,
                    phone: req.body.phone,
                    image: req.body.image,
                },
                req.body.role,
                req.body.position);
        }

        res.status(200).send(newUser);

    } catch (err) {
        res.status(400).send(err.message);
    }

});


router.put('/:userId', multerUpload.single('image'), isRelatedToOrganization, hasPermissionForUpdatingOrganizationUsers, updateFile, parsePhone, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const {userId} = req.params;

        console.log("inside router");
        console.log({
            name: req.body.name,
            email: req.body.email,
            phone: req.body.phone,
            image: req.body.image,
        });

        const updatedUser = await userController.update(userId, {
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                image: req.body.image,
            },
            req.body.position);

        console.log({result: updatedUser});
        res.status(200).send(updatedUser);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.put('/:userId/suspend', ...suspendDataValidator, hasPermissionForSuspendingOrganizationUsers, async (req: any, res: any) => {

    try {

        const {userId} = req.params;

        const suspendedUser = await userController.checkSuspend(userId);

        res.status(200).send(suspendedUser);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.put('/:userId/suspend/confirmed', ...suspendDataValidator, hasPermissionForSuspendingOrganizationUsers, async (req: any, res: any) => {

    try {

        const {userId} = req.params;
        const {to} = req.body;

        const suspendedUser = await userController.suspendConfirmed(userId, to);

        res.status(200).send(suspendedUser);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/ad', multerUpload.single('image'), uploadFile, async (req: any, res: any) => {

    try {

        const newUser = await userController.createUser1({
                name: req.body.name,
                email: req.body.email,
                phone: req.body.phone,
                image: req.body.image,
                password: req.body.password
            },
            req.body.role,
            req.body.position);

        res.status(200).send(newUser);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;