import {DEFAULT_IMAGES, DESTINATIONS, PUBLIC_FOLDER} from '@config';
import uuidv4 from "uuid/v4";
import path from "path";
import fs from "fs";
import User from "@db/User";

export const parsePhone = async (req: any, res: any, next: any) => {
    try {

        let { phone } = req.body;

        req.body.phone = JSON.parse(phone);

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};


export const updateFile = async (req: any, res: any, next: any) => {

    try {

        const user = await User.findById(req.user._id, '-_id');



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