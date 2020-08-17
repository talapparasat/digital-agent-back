import {DESTINATIONS, DEFAULT_IMAGES, PUBLIC_FOLDER} from "@config";
import uuidv4 from "uuid/v4";
import path from "path";
import fs from "fs";
import ServiceCategory from '@db/Service-category';

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
        console.log(page);

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
            req.body.image = DEFAULT_IMAGES.serviceCategory;
            return next();
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = DESTINATIONS.serviceCategory + filename;
        console.log(filepath);

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const serviceCategory = await ServiceCategory.findById(req.params.serviceCategoryId, '-_id');

        if(req.file == undefined) {
            req.body.image = serviceCategory.image;
            return next();
        }


        await fs.unlink(PUBLIC_FOLDER + serviceCategory.image, function (err) {
            console.log(err)
        });


        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);
        const filepath = DESTINATIONS.serviceCategory + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};