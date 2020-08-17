import multer from "multer";
import {storageConfigs} from "@mw/fileUpload";
import { DESTINATIONS, DEFAULT_IMAGES } from "@config";
import {ROLES} from "@db/Role";
import UserOrganization from '@db/User-organization';
import {authErrors} from "@errors";


export const upload = multer({storage:storageConfigs(DESTINATIONS.serviceProviderType, DEFAULT_IMAGES.serviceProviderType)}).single('image');

export const validateFile = async (req: any, res: any, next: any) => {
    try {

        req.body.image = req.file? req.body.image : DEFAULT_IMAGES.serviceProviderType;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const selectAdminOrganization = async (req: any, res: any, next: any) => {
    try {

        if(req.user.roles.includes(ROLES.ADMIN)) {
            let organization = await UserOrganization.findOne({userId: req.user._id})

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