import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import OSPT from "@db/Organization_Service-provider-type";
import OSTP_SN from '@db/OSPT_Service-name';
import OSTP_SC from '@db/OSPT_Service-category';
import ServiceName from '@db/Service-name';

import ERROR, {relationErrors} from "@errors";

export const superAdminRoleValidator = roleValidator(ROLES.SUPER_ADMIN);

export const getByIdValidator = dataValidator(({ param }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);

export const createDataValidator = dataValidator(({ body }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    // body('attachmentId')
    //     .not().isEmpty()
    //     .trim()
]);

export const updateDataValidator = dataValidator(({ body, check, param }) => [
    body('nameKz')
        .not().isEmpty()
        .trim(),
    body('nameRu')
        .not().isEmpty()
        .trim(),
    // body('attachmentId')
    //     .not().isEmpty()
    //     .trim(),
    check('suspended')
        .exists()
        .isBoolean(),
    param('organizationId')
        .not().isEmpty()
        .isMongoId()
]);


export const suspendDataValidator = dataValidator(({ param, body }) => [
    param('organizationId')
        .not().isEmpty()
        .isMongoId(),
    param('serviceCategoryId')
        .not().isEmpty()
        .isMongoId(),
    body('serviceProviderTypeId')
        .not().isEmpty()
        .isMongoId()
]);


export const isOrganizationRelatedToServiceProviderType = async (req: any, res: any, next: any )=> {

    try {

        const organizationId  = req.params.organizationId;
        const serviceProviderTypeId  = req.body.serviceProviderTypeId;

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


export const isOSPTRelatedNotToServiceCategoryYet = async (req: any, res: any, next: any )=> {

    try {

        const { osptId }  = req.body;
        const { serviceCategoryId }  = req.params;

        const OSPT_ServiceCategoryRelation = await OSTP_SC.findOne({
            osptId,
            serviceCategoryId,
            suspended: false
        });

        if (OSPT_ServiceCategoryRelation) {
            req.body.ospt_scId = OSPT_ServiceCategoryRelation._id;
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.NO_SUCH_RELATION));

    } catch(err) {
        res.status(400).send(err);
    }
};



export const isOSPTRelatedToServiceCategory = async (req: any, res: any, next: any )=> {

    try {

        const { osptId }  = req.body;
        const { serviceCategoryId }  = req.params;

        const OSPT_ServiceCategoryRelation = await OSTP_SC.findOne({
            osptId,
            serviceCategoryId,
            suspended: false
        });

        if (OSPT_ServiceCategoryRelation) {
            req.body.ospt_scId = OSPT_ServiceCategoryRelation._id;
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.NO_SUCH_RELATION));

    } catch(err) {
        res.status(400).send(err);
    }
};

