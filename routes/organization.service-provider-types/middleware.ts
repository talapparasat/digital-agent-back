import {DESTINATIONS, DEFAULT_IMAGES, PUBLIC_FOLDER} from "@config";
import uuidv4 from "uuid/v4";
import path from "path";
import fs from "fs";
import ServiceProviderType from "@db/Service-provider-type";


export const uploadFile = async (req: any, res: any, next: any) => {

    try {

        if(req.file == undefined) {
            req.body.image = DEFAULT_IMAGES.serviceProviderType;
            return next();
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = DESTINATIONS.serviceProviderType + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const serviceProviderType = await ServiceProviderType.findById(req.params.serviceProviderTypeId, '-_id');

        if(req.file == undefined) {
            req.body.image = serviceProviderType.image;
            return next();
        }


        await fs.unlink(PUBLIC_FOLDER + serviceProviderType.image, function (err) {
            console.log(err)
        });


        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);
        const filepath = DESTINATIONS.serviceProviderType + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};