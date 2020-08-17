import {DESTINATIONS, DEFAULT_IMAGES, PUBLIC_FOLDER} from '@config';
import fs from "fs";
import uuidv4 from "uuid/v4";
import path from "path";
import User from "@db/User";
import {ROLES} from "@db/Role";
import UserOrganization from "@db/User-organization";
import {authErrors} from "@errors";
import UserRole from "@db/User-role";


export const parsePhone = async (req: any, res: any, next: any) => {
    try {

        let { phone } = req.body;

        req.body.phone = JSON.parse(phone);

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const pagination = async (req: any, res: any, next: any) => {
    try {
        let query = req.query['query'];

        if(!query) {
            query = ""
        } else if(query.trim().length < 1) {
            query = ""
        }

        req.query['query'] = query;


        let page = parseInt(req.query['page']);

        if(isNaN(page)) {
            page = 1;
        } else if(page < 1) {
            page = 1
        }

        req.query['page'] = page;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const uploadFile = async (req: any, res: any, next: any) => {

    try {

        if(req.file == undefined) {
            req.body.image = DEFAULT_IMAGES.user;
            return next();
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = DESTINATIONS.user + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const user = await User.findById(req.params.userId, '-_id');

        if(req.file == undefined) {

            if(!user.image) {
                req.body.image = DEFAULT_IMAGES.user;
            } else {
                req.body.image = user.image;
            }
            return next();
        }


        await fs.unlink(PUBLIC_FOLDER + user.image, function (err) {
            console.log(err)
        });


        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);
        const filepath = DESTINATIONS.user + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

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

export const selectConfirmingUserRoleAndOrganization = async (req: any, res: any, next: any) => {
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