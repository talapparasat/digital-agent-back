import UserOrganization from '@db/User-organization';
import UserRole from '@db/User-role';
import User from '@db/User';
import ERROR, { authErrors, relationErrors } from "@errors";
import dataValidator from "@mw/validators/data";
import { ROLES } from '@db/Role';
import { maintainOrganizationUsersPermissions } from '@config/permissions';


import UserOrganisation from '@db/User-organization';

export const getDataValidator = dataValidator(({ body, check, param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const createDataValidator = dataValidator(({ body, check, param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const addUsersValidator = dataValidator(({ body, check, param }) => [
    body('users')
        .not().isEmpty(),
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [
    body('phone')
        .not().isEmpty()
        .trim(),
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('userId')
        .not().isEmpty()
        .isMongoId()
]);

export const suspendDataValidator = dataValidator(({ body, check, param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('userId')
        .not().isEmpty()
        .isMongoId()
]);

export const isRelatedToOrganization = async (req: any, res: any, next: any) => {

    const { _id: userId, roles } = req.user;
    const { organizationId } = req.params;

    if (roles.includes(ROLES.SUPER_ADMIN)) {
        return next();
    }

    const userOrganizationRelations = await UserOrganization.findOne({
        userId,
        organizationId
    });


    if (userOrganizationRelations) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));
};


export const hasPermissionForCreatingOrganizationUsers = async (req: any, res: any, next: any) => {

    const { role }: any = req.body;
    const { roles }: any = req.user;
    const rolesThatHavePermission = maintainOrganizationUsersPermissions[role];
    const isAllowed = (userRoles: string[]) => userRoles.filter(userRole => rolesThatHavePermission.includes(userRole)).length > 0;

    if (isAllowed(roles)) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};


export const hasPermissionForGettingOrganizationUsers = async (req: any, res: any, next: any) => {

    const {userId} = req.params;

    const user = await User.findById(userId);

    let role = await user.getRole();
    console.log(role);

    const { roles }: any = req.user;
    const rolesThatHavePermission = maintainOrganizationUsersPermissions[role];
    const isAllowed = (userRoles: string[]) => userRoles.filter(userRole => rolesThatHavePermission.includes(userRole)).length > 0;

    if (isAllowed(roles)) {
        return next();
    }

    res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

};

export const isUpdatingUserRelatedToOrganization = async (req: any, res: any, next: any )=> {

    try {

        const { organizationId, userId } = req.params;

        const userOrganizationRelations = await UserOrganisation.count({
            organizationId,
            userId
        });

        if (userOrganizationRelations > 0) {
            return next();
        }

        res.status(400).send(new ERROR(authErrors.PERMISSION_REQUIRED));

    } catch(err) {

    }

};


export const isUserNotConnectedToOrganization = async (req: any, res: any, next: any) => {
    try {

        const userOrganization = await UserOrganization.findOne({
            userId: req.params.userId,
            organizationId: req.params.organizationId
        });

        if(!userOrganization) {
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.RELATION_ALREADY_EXISTS));

    } catch(err) {

        res.status(422).send(err);

    }
};