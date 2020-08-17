import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";

export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);
export const adminSuperAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);


export const createDataValidator = dataValidator(({ body }) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('info')
        .not().isEmpty()
        .trim(),
    body('address')
        .not().isEmpty()
        .trim(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId(),
    body('attachmentImageId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('info')
        .not().isEmpty()
        .trim(),
    body('address')
        .not().isEmpty()
        .trim(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId(),
    body('attachmentImageId')
        .not().isEmpty()
        .isMongoId(),
    check('suspended')
        .exists()
        .isBoolean(),
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);

export const addUsersValidator = dataValidator(({ body, check, param }) => [
    body('users')
        .not().isEmpty(),
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);


export const getOperatorsWithFreeDataValidator = dataValidator(({ body, check, param }) => [
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);

