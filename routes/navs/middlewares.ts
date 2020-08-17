import OSPT from "@db/Organization_Service-provider-type";
import ERROR, {navigationErrors, relationErrors} from "@errors";

export const selectOSPT = async (req: any, res: any, next: any )=> {

    try {

        let organizationId = req.query['organizationId'];
        let serviceProviderTypeId = req.query['serviceProviderTypeId'];

        if(!organizationId) {
            const OSPTRelations = await OSPT.find({
                serviceProviderTypeId,
                suspended: false
            });

            if(OSPTRelations.length != 1) {
                res.status(400).send(new ERROR(navigationErrors.ORGANIZATION_ID_NOT_SPECIFIED));
                return
            }

            req.body.osptId = OSPTRelations[0]._id;
            return next();
        } else {
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
        }

    } catch(err) {
        res.status(400).send(err);
    }
};