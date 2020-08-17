import {ROLES} from "@db/Role";
import UserOrganization from "@db/User-organization";
import OSP from "@db/Organization_Service-provider";
import ERROR, {authErrors, relationErrors} from "@errors";

export const parseUsers = async (req: any, res: any, next: any) => {
    try {

        let { users } = req.body;

        req.body.users = JSON.parse(users);

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const selectUserOrganization = async (req: any, res: any, next: any) => {
    try {

        if(req.user.roles.includes(ROLES.ADMIN)) {
            let organization = await UserOrganization.findOne({userId: req.user._id});

            if(!organization) {
                throw new Error(authErrors.PERMISSION_REQUIRED)
            }

            req.body.organizationId = organization.organizationId;
        }

        next()

    } catch(err) {

        res.status(400).send(err);

    }
};


export const selectServiceProviderOrganization = async (req: any, res: any, next: any) => {
    try {

        const organization = await OSP.findOne({
            serviceProviderId: req.params.serviceProviderId
        });

        if(!organization) {
            throw new ERROR(relationErrors.SERVICE_PROVIDER_NOT_RELATED_TO_ORGANIZATION)
        }

        req.body.organizationId = organization.organizationId;

        next()

    } catch(err) {

        res.status(400).send(err);

    }
};

