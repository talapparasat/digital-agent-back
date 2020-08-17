import {DEFAULT_IMAGES, DESTINATIONS, PUBLIC_FOLDER} from "@config";
import uuidv4 from "uuid/v4";
import path from "path";
import fs from "fs";
import ServiceProvider from "@db/Service-provider";
import {ROLES} from "@db/Role";
import UserOrganization from "@db/User-organization";
import {authErrors} from "@errors";

export const uploadFile = async (req: any, res: any, next: any) => {

    try {

        if(req.file == undefined) {
            req.body.image = DEFAULT_IMAGES.serviceProvider;
            return next();
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = DESTINATIONS.serviceProvider + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const serviceProvider = await ServiceProvider.findById(req.params.serviceProviderId, '-_id');

        if(req.file == undefined) {

            if(!serviceProvider.image) {
                req.body.image = DEFAULT_IMAGES.user;
            } else {
                req.body.image = serviceProvider.image;
            }
            return next();
        }


        await fs.unlink(PUBLIC_FOLDER + serviceProvider.image, function (err) {
            console.log(err)
        });


        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);
        const filepath = DESTINATIONS.serviceProvider + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};

export const selectAdminOrganization = async (req: any, res: any, next: any) => {
    try {

        let organization = await UserOrganization.findOne({userId: req.user._id});

        if(!organization) {
            throw new Error(authErrors.PERMISSION_REQUIRED)
        }

        req.body.organizationId = organization.organizationId;

        next()

    } catch(err) {

        res.status(400).send(err);

    }
};


export const selectUserOrganization = async (req: any, res: any, next: any) => {
    try {

        if(req.user.roles.includes(ROLES.ADMIN)) {
            let organization = await UserOrganization.findOne({userId: req.user._id});

            console.log(organization);
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

export const setApprovedState = async (req: any, res: any, next: any) => {
    try {

        req.body.approved = req.user.roles.includes(ROLES.SUPER_ADMIN);

        next()

    } catch(err) {

        res.status(400).send(err);

    }
};


export const pagination = async (req: any, res: any, next: any) => {
    try {
        let query = req.query['query'];

        if (!query) {
            query = ""
        } else if (query.trim().length < 1) {
            query = ""
        }

        req.query['query'] = query;


        let page = parseInt(req.query['page']);

        if (isNaN(page)) {
            page = 1;
        } else if (page < 1) {
            page = 1
        }

        req.query['page'] = page;

        next()

    } catch (err) {

        res.status(422).send(err);

    }
};


export const parseWorkHours = async (req: any, res: any, next: any) => {
    try {

        let {workHours} = req.body;

        workHours = JSON.parse(workHours);

        if(!Array.isArray(workHours)) {
            throw new Error('Invalid work hours');
        }

        console.log(workHours);

        workHours = workHours.map((day:any) => {
            if(!day.start && !day.end) {
                console.error(1);
                day.start = null;
                day.end = null;
                return day;
            }

            day.start = day.start.split(":");

            if(day.start.length != 2) {
                console.error(2);
                day.start = null;
                day.end = null;
                return day;
            }

            if(!Number.isInteger(Number(day.start[0]))|| !Number.isInteger(Number(day.start[1]))) {
                console.error(3);
                day.start = null;
                day.end = null;
                return day;
            }

            day.start = day.start[0] + ":" + day.start[1];

            // console.log({start: day.start});
            // let startTime = new Date();
            // startTime.setHours(day.start[0]);
            // startTime.setMinutes(day.start[1]);
            // console.log({startTime});


            day.end = day.end.split(":");

            if(day.end.length != 2) {
                console.error(4);
                day.start = null;
                day.end = null;
                return day;
            }

            if(!Number.isInteger(Number(day.end[0]))|| !Number.isInteger(Number(day.end[1]))) {
                console.error(5);
                day.start = null;
                day.end = null;
                return day;
            }

            day.end = day.end[0] + ":" + day.end[1];

            // console.log({end: day.start});
            // let endTime = new Date();
            // endTime.setHours(day.end[0]);
            // endTime.setMinutes(day.end[1]);
            // console.log({endTime});
            //
            // day.start = startTime;
            // day.end = endTime;

            return day;
        });

        // workHours = workHours.map((day: any) => {
        //     if(!day.start && !day.end) {
        //         console.error(1);
        //         day.start = null;
        //         day.end = null;
        //         return day;
        //     } else {
        //
        //     }
        // });

        console.log(workHours);

        req.body.workHours = workHours;

        next()

    } catch (err) {

        res.status(422).send(err.message);

    }
};