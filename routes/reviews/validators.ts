import dataValidator from "@mw/validators/data";
import roleValidator from "@mw/validators/role";
import {ROLES} from "@db/Role";
import OSPT from "@db/Organization_Service-provider-type";
import OSP from "@db/Organization_Service-provider";
import OSPT_Field from "@db/OSPT_Field";
import ServiceProvider from "@db/Service-provider";
import ERROR, {additionalFieldErrors} from "@errors";

export const getAllRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.OPERATOR);
export const getByIdRoleValidator = roleValidator(ROLES.SUPER_ADMIN, ROLES.SUPERVISOR, ROLES.OPERATOR);
export const createRoleValidator = roleValidator();
export const removeRoleValidator = roleValidator(ROLES.SUPER_ADMIN);


export const createDataValidator = dataValidator(({ body }) => [
    body('rate')
        .not().isEmpty()
        .trim(),
    body('serviceProviderId')
        .not().isEmpty()
        .isMongoId()
]);

export const removeDataValidator = dataValidator(({ param }) => [
    param('reviewId')
        .not().isEmpty()
        .isMongoId()
]);

export const additionalFieldValidator = async (req: any, res: any, next: any )=> {

    try {

        const serviceProvider = await ServiceProvider.findById(req.body.serviceProviderId);

        const osp = await OSP.findOne({
            serviceProviderId: serviceProvider._id
        });

        const organizationId = osp.organizationId;
        const serviceProviderTypeId = serviceProvider.serviceProviderTypeId;

        const ospt = await OSPT.findOne({
            organizationId,
            serviceProviderTypeId
        });

        console.log({ospt});

        const requiredFields = await OSPT_Field.aggregate([
            {
                $match: {
                    osptId: ospt._id,
                    suspended: false
                }
            },
            {
                $lookup: {
                    from: 'fields',
                    localField: 'fieldId',
                    foreignField: '_id',
                    as: 'Field'
                }
            },
            {
                $unwind: '$Field'
            },
            {
                $replaceRoot: {
                    newRoot: '$Field'
                }
            },
            {
                $match: {
                    required: true
                }
            }
        ]);

        console.log({requiredFields});

        let isEmpty = false;
        requiredFields.map(field => {
            if(!req.body[field._id]) {
                isEmpty = true
            }
        });

        if(isEmpty) {
            return res.status(400).send(new ERROR(additionalFieldErrors.EMPTY_REQUIRED_FIELD));
        }

        return next()

    } catch(err) {
        console.log(err);
        res.status(400).send(new ERROR(additionalFieldErrors.EMPTY_REQUIRED_FIELD));
    }

};