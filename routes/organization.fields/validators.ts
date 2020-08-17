import OSPT from "@db/Organization_Service-provider-type";
import ERROR, {relationErrors} from "@errors";

export const isOrganizationRelatedToServiceProviderType = async (req: any, res: any, next: any )=> {

    try {

        let organizationId = req.params.organizationId;
        let serviceProviderTypeId = req.query['serviceProviderTypeId'];

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


export const isOrganizationRelatedToServiceProviderType1 = async (req: any, res: any, next: any )=> {

    try {

        let organizationId = req.params.organizationId;
        let serviceProviderTypeId = req.body.serviceProviderTypeId;

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