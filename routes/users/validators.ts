import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import {ROLES} from "@db/Role";
import User from '@db/User'
import UserOrganization from "@db/User-organization";
import ERROR, {authErrors, userErrors} from "@errors";
import crypto from "crypto";
import {maintainOrganizationUsersPermissions} from '@config/permissions';
import mongoose from "mongoose";

const ObjectId = mongoose.Types.ObjectId;


export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);
export const adminSuperAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const getOperatorsRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPERVISOR);

export const createSupervisorRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);


export const getByIdDataValidator = dataValidator(({body, check, param}) => [
    param('userId')
        .not().isEmpty()
        .isMongoId()
        .custom((value: string, {req}: any) => {
            return User.findOne({_id: value}).then(user => {
                if (!user) {
                    return Promise.reject('User not found');
                }

                req.requiredUser = user;
            });
        })
]);

export const updateDataValidator = dataValidator(({body, param}) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            console.log("User id from validator", req.params.userId);
            return User.findOne({
                email: value,
                _id: {$ne: ObjectId(req.params.userId)}
            })
                .then(user => {
                    if (user) {
                        return Promise.reject('E-mail already in use');
                    }
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
    body('image')
        .not().isEmpty()
        .trim(),
    body('position')
        .not().isEmpty()
        .trim(),
    param('userId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataMobileValidator = dataValidator(({body, param}) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('phone')
        .not().isEmpty()
        .trim(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            console.log("User id from validator", req.params.userId);
            return User.findOne({
                email: value,
                _id: {$ne: ObjectId(req.params.userId)}
            })
                .then(user => {
                    if (user) {
                        return Promise.reject('E-mail already in use');
                    }
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
    body('image')
        .not().isEmpty()
        .trim(),
    param('userId')
        .not().isEmpty()
        .isMongoId()
]);

export const createDataValidator = dataValidator(({body}) => [
    body('name')
        .not().isEmpty().withMessage('Name is required!')
        .trim(),
    body('phone')
        .not().isEmpty()
        .trim(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string) => {
            return User.findOne({email: value}).then(user => {
                if (user) {
                    return Promise.reject('E-mail already in use');
                }
            });
        })
        .normalizeEmail({gmail_remove_dots: false}),
    body('image')
        .not().isEmpty()
        .trim(),
    body('position')
        .not().isEmpty()
        .trim(),
    body('role')
        .not().isEmpty()
        .trim()
]);


export const suspendDataValidator = dataValidator(({body, check, param}) => [
    param('userId')
        .not().isEmpty()
        .isMongoId()
        .custom((value: string, {req}: any) => {
            return User.findOne({_id: value}).then(user => {
                if (!user) {
                    return Promise.reject('User not found');
                }

                req.updatingUser = user;
            });
        })
]);


export const confirmOperatorDataValidator = dataValidator(({body, check, param}) => [
    param('userId')
        .not().isEmpty()
        .isMongoId()
        .custom((value: string, {req}: any) => {
            return User.findOne({_id: value}).then(user => {
                if (!user) {
                    return Promise.reject('User not found');
                }

                req.requiredUser = user;
            });
        })
]);


export const isRelatedToOrganization = async (req: any, res: any, next: any) => {

    const {_id: userId, roles} = req.user;

    if (roles.includes(ROLES.SUPER_ADMIN)) {
        return next();
    }

    const userOrganizationRelations = await UserOrganization.findOne({
        userId
    });

    console.log({userOrganizationRelations});

    if (userOrganizationRelations) {
        req.body.organizationId = userOrganizationRelations.organizationId;
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));
};


export const confirmRoleValidator = async (req: any, res: any, next: any) => {

    const {_id: userId, roles} = req.user;

    console.log({roles, userId});

    if (roles.includes(ROLES.SUPER_ADMIN)) {
        return next();
    }

    const userOrganizationRelations = await UserOrganization.findOne({
        userId
    });

    console.log({userOrganizationRelations});

    if (userOrganizationRelations) {
        req.body.organizationId = userOrganizationRelations.organizationId;
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};


export const hasPermissionForGettingOrganizationUsers = async (req: any, res: any, next: any) => {

    const {userId} = req.params;

    const requiredUser = req.requiredUser;//await User.findById(userId);

    const role = await requiredUser.getRole();

    const {roles}: any = req.user;
    const rolesThatHavePermission = maintainOrganizationUsersPermissions[role];
    const isAllowed = (userRoles: string[]) => userRoles.filter(userRole => rolesThatHavePermission.includes(userRole)).length > 0;

    if (isAllowed(roles)) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};


export const hasPermissionForUpdatingOrganizationUsers = async (req: any, res: any, next: any) => {

    const {userId} = req.params;

    const updatingUser = await User.findById(userId);

    if (!updatingUser) {
        res.status(400).send(new ERROR(userErrors.USER_NOT_FOUND));
    }

    const role = await updatingUser.getRole();

    const {roles}: any = req.user;
    const rolesThatHavePermission = maintainOrganizationUsersPermissions[role];
    const isAllowed = (userRoles: string[]) => userRoles.filter(userRole => rolesThatHavePermission.includes(userRole)).length > 0;

    if (isAllowed(roles)) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};


export const hasPermissionForSuspendingOrganizationUsers = async (req: any, res: any, next: any) => {

    const {userId} = req.params;

    const updatingUser = req.updatingUser;//await User.findById(userId);

    const role = await updatingUser.getRole();

    const {roles}: any = req.user;
    const rolesThatHavePermission = maintainOrganizationUsersPermissions[role];
    const isAllowed = (userRoles: string[]) => userRoles.filter(userRole => rolesThatHavePermission.includes(userRole)).length > 0;

    if (isAllowed(roles)) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};
