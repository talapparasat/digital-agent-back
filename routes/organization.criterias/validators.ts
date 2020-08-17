import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import { ROLES } from "@db/Role";
import OSPT from "@db/Organization_Service-provider-type";
import OSPT_SN from '@db/OSPT_Service-name';
import OSPT_SC from '@db/OSPT_Service-category';
import ServiceName from '@db/Service-name';

import ERROR, {relationErrors} from "@errors";
import OSPT_SC_SC from "@db/OSPT_SC_SC";

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
    param('serviceCriteriaId')
        .not().isEmpty()
        .isMongoId(),
    body('serviceCategoryId')
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


export const isOrganizationNotHaveServiceNameYet = async (req: any, res: any, next: any )=> {

    try {

        const osptId = req.body.osptId;
        const serviceNameId  = req.params.serviceNameId;

        let ospt_sn_relation = await OSPT_SN.findOne({
            osptId,
            serviceNameId,
            suspended: false
        });

        if(!ospt_sn_relation) {
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.RELATION_ALREADY_EXISTS));

    } catch(err) {
        res.status(400).send();
    }

};


export const isOSPTRelatedToServiceCategory = async (req: any, res: any, next: any )=> {

    try {

        const { osptId, serviceCategoryId }  = req.body;

        const OSPT_ServiceCategoryRelation = await OSPT_SC.findOne({
            osptId,
            serviceCategoryId
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


export const isOSPT_SC_RelatedToServiceCriteria = async (req: any, res: any, next: any )=> {

    try {

        const { ospt_scId }  = req.body;
        const { serviceCriteriaId } = req.params;

        const OSPT_SC_serviceCriteria = await OSPT_SC_SC.findOne({
            osptServiceCategoryId: ospt_scId,
            serviceCriteriaId
        });

        if (OSPT_SC_serviceCriteria) {
            req.body.ospt_sc_scId = OSPT_SC_serviceCriteria._id;
            return next();
        }

        res.status(400).send(new ERROR(relationErrors.NO_SUCH_RELATION));

    } catch(err) {
        res.status(400).send(err);
    }
};