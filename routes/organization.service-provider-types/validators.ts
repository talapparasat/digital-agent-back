import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import OSPT from "@db/Organization_Service-provider-type";
import ERROR, {relationErrors} from "@errors";

export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);
export const getServiceProviderTypeRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.ADMIN);


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

export const connectDataValidator = dataValidator(({ param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('serviceProviderTypeId')
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

export const isOrganizationNotRelatedToServiceProviderTypeYet = async (req: any, res: any, next: any )=> {

    try {

        const { organizationId, serviceProviderTypeId } = req.body;

        const OSPTRelation = await OSPT.findOne({
            organizationId,
            serviceProviderTypeId,
            suspended: false
        });

        if (!OSPTRelation) {
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.RELATION_ALREADY_EXISTS));

    } catch(err) {
        res.status(400).send();
    }

};

export const isOrganizationRelatedToServiceProviderType = async (req: any, res: any, next: any )=> {

    try {

        const { organizationId, serviceProviderTypeId } = req.params;

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
        res.status(400).send(err);
    }

};
