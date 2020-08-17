import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import UserOrganisation from "@db/User-organization";
import OSPT from '@db/Organization_Service-provider-type';
import ERROR, {authErrors, relationErrors} from "@errors";

export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);

export const createDataValidator = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim()
]);

export const createAndConnectDataValidator = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    body('organizationId')
        .not().isEmpty()
        .isMongoId(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    param('serviceCriteriaId')
        .not().isEmpty()
        .isMongoId()
]);

export const suspendDataValidator = dataValidator(({ body, check, param }) => [
    param('serviceCriteriaId')
        .not().isEmpty()
        .isMongoId()
]);

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