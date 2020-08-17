import express from 'express';
import multer from 'multer';
import importationController from '@controllers/importation'
import path from 'path'

import {
    uploadFile
} from './middlewares'

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.post('/supervisors', multerUpload.single('file'), uploadFile, async (req: any, res: any) => {

    try {

        const {filepath} = req.body;

        const result = await importationController.importSupervisors(filepath);

        res.status(200).send(result)

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


router.post('/service-providers', multerUpload.single('file'), uploadFile, async (req: any, res: any) => {

    try {

        const {filepath} = req.body;

        const result = await importationController.importServiceProviders(filepath);

        res.sendFile(path.resolve(__dirname + '/../../../public/temp/response.txt'));
        //
        // res.status(200).send(result)

        // res.send(result)

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


router.get('/service-providers/template', async (req: any, res: any) => {

    try {

        res.download('public/templates/Service-providers-template.xlsx');

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});

router.get('/supervisors/template', async (req: any, res: any) => {

    try {

        res.download('public/templates/Supervisors-template.xlsx');

    } catch (err) {

        console.log(err);

        res.status(400).send(err);
    }

});


export default router;