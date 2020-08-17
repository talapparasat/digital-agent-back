import multer from 'multer'
import uuidv4 from 'uuid/v4'
import {DEFAULT_IMAGES, DESTINATIONS, PUBLIC_FOLDER} from "@config";
import path from "path";
import fs from "fs";
import Organization from "@db/Organization";

export const storageConfigs = (destination: string, defaultName: string) => {
    return multer.diskStorage({

        destination: (req, file, cb) =>{
            cb(null, destination);
        },

        filename: (req:any, file, cb) =>{
            console.log("insider");
            let filename = createFileName(file);
            req.body.image = destination.substring(7, destination.length) + filename;
            cb(null, filename);
        }

    });
};

export const createFileName = (file:any) => {
    let i = file.originalname.lastIndexOf('.');
    let ext = i ? file.originalname.substr(i + 1) : 'jpeg';
    // name = name.replace(new RegExp(" ", 'g'), "");
    // var d = new Date();
    // var date = d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate() + "_" + d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
    return uuidv4() + '.' + ext
};

export const generateUploadFile = (destination: string) => {

    return async (req: any, res: any, next: any) => {

        try {

            if (req.file == undefined) {
                req.body.image = DEFAULT_IMAGES.organization;
                return next();
            }

            const buffer = req.file.buffer;

            const filename = uuidv4() + path.extname(req.file.originalname);

            const filepath = destination + filename;

            fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

            req.body.image = filepath;

            next()

        } catch (err) {

            res.status(422).send(err);

        }
    }

};

export const uploadFile = async (req: any, res: any, next: any) => {

    try {

        if(req.file == undefined) {
            req.body.image = DEFAULT_IMAGES.organization;
            return next();
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = DESTINATIONS.organization + filename;

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.image = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const organization = await Organization.findById(req.params.organizationId, '-_id');

        if(req.file == undefined) {
            req.body.image = organization.image;
            return next();
        }


        await fs.unlink(PUBLIC_FOLDER + organization.image, function (err) {
            console.log(err)
        });

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        fs.writeFileSync(DESTINATIONS.organization + filename, buffer, 'binary');

        req.body.image = 'uploads/organizations/' + filename;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};