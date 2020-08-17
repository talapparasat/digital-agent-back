import UserRole from '@db/User-role';
import {storageConfigs} from '@mw/fileUpload';
import { DESTINATIONS, DEFAULT_IMAGES} from '@config';
import multer from 'multer'
import UserOrganization from "@db/User-organization";


export const selectUpdatingUserRole = async (req: any, res: any, next: any) => {
    try {

        const { userId } = req.params;

        console.log(userId);

        const userRole: any = await UserRole.findOne({
            userId: userId
        }).populate('roleId');

        // Записываем в body для передачи в validator hasPermissionForCreatingOrganizationUsers
        req.body.role = userRole.roleId.name;

        console.log(req.body);

        return next();

    } catch(err) {

        res.status(422).send(err);

    }
};


export const upload = multer({storage:storageConfigs(DESTINATIONS.user, DEFAULT_IMAGES.user)}).single('image');

export const parsePhone = async (req: any, res: any, next: any) => {
    try {

        let { phone } = req.body;

        req.body.phone = JSON.parse(phone);

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const validateFile = async (req: any, res: any, next: any) => {
    try {

        req.body.image = req.file ? req.body.image : DEFAULT_IMAGES.user;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const parseUsers = async (req: any, res: any, next: any) => {
    try {

        let { users } = req.body;

        req.body.users = JSON.parse(users);

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


