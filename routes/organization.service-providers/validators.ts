import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import OSPT from "@db/Organization_Service-provider-type";
import ERROR, {relationErrors} from "@errors";

export const connectRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);
export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);
export const autocompleteRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);

export const createDataValidator = dataValidator(({ body }) => [
    body('organizationId')
        .not().isEmpty()
        .isMongoId(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [

]);

export const connectDataValidator = dataValidator(({ body, param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId(),
    body('supervisorId')
        .not().isEmpty()
        .isMongoId()
]);

export const suspendDataValidator = dataValidator(({ param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);
