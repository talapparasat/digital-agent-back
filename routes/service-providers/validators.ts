import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";

export const createRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const updateRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const connectRoleValidator = roleValidator(ROLES.ADMIN);

export const adminSuperAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const getServiceProvidersRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN, ROLES.SUPERVISOR);
export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);


export const createDataValidator = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    body('info')
        .not().isEmpty()
        .trim(),
    body('address')
        .not().isEmpty()
        .trim(),
    body('image')
        .not().isEmpty()
        .trim()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    body('info')
        .not().isEmpty()
        .trim(),
    body('address')
        .not().isEmpty()
        .trim(),
    body('image')
        .not().isEmpty()
        .trim(),
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);

export const connectDataValidator = dataValidator(({ body, check, param }) => [
    body('supervisorId')
        .not().isEmpty()
        .isMongoId(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId(),
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);


export const autocompleteDataValidator = dataValidator(({ body, check, param }) => [
    body('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const approveDataValidator = dataValidator(({ body, check, param }) => [
    param('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);


export const searchDataValidator = dataValidator(({ body, check, param }) => [
    check('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);
