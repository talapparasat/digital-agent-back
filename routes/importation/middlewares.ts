import {IMPORTATION_FOLDER, PUBLIC_FOLDER} from "@config";
import uuidv4 from "uuid/v4";
import path from "path";
import fs from "fs";
import ERROR from "@errors";

export const uploadFile = async (req: any, res: any, next: any) => {

    try {

        if(req.file == undefined) {
            throw new ERROR('File not provided');
        }

        const buffer = req.file.buffer;

        const filename = uuidv4() + path.extname(req.file.originalname);

        const filepath = IMPORTATION_FOLDER + filename;
        console.log(filepath);

        fs.writeFileSync(PUBLIC_FOLDER + filepath, buffer, 'binary');

        req.body.filepath = filepath;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};