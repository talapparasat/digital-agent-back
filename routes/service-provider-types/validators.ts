import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import {param} from "express-validator/check";
import OSTP_SN from "@db/OSPT_Service-name";
import OSPT from "@db/Organization_Service-provider-type";
import ERROR, {relationErrors} from "@errors";


export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);

export const createDataValidator = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim()
]);

export const createDataValidatorWithType = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataValidator = dataValidator(({ body, param }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    param('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);

export const suspendDataValidator = dataValidator(({ param }) => [
    param('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);

export const isOrganizationNotRelatedToServiceProviderTypeYet = async (req: any, res: any, next: any )=> {

    try {

        const { organizationId, serviceProviderTypeId } = req.body;

        const OSPTRelation = await OSPT.findOne({
            organizationId,
            serviceProviderTypeId,
            suspended: false
        });

        if (!OSPTRelation) {
            req.body.osptId = OSPTRelation._id;
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.RELATION_ALREADY_EXISTS));

    } catch(err) {

    }

};

export const isOrganizationRelatedToServiceProviderType = async (req: any, res: any, next: any )=> {

    try {

        const { organizationId, serviceProviderTypeId } = req.body;

        const OSPTRelation = await OSPT.findOne({
            organizationId,
            serviceProviderTypeId,
            suspended: false
        });

        if (OSPTRelation) {
            req.body.osptId = OSPTRelation._id;
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.NO_SUCH_RELATION));

    } catch(err) {

    }

};