import express from 'express';
import fieldController from "@controllers/field";

import {
    pagination
} from "./middlewares"

const router = express.Router();


router.get('/', pagination, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        let fields = await fieldController.getAll(page, query);

        res.status(200).send(fields);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/:fieldId', async (req: any, res: any) => {

    try {

        const {fieldId} = req.params;

        let field = await fieldController.getById(fieldId);

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', async (req: any, res: any) => {

    try {

        let {name, labelKz, labelRu, type, required} = req.body;

        let field = await fieldController.create({name, labelKz, labelRu, type, required});

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:fieldId', async (req: any, res: any) => {

    try {

        let {name, labelKz, labelRu, type, required} = req.body;
        let {fieldId} = req.params;

        let field = await fieldController.update(fieldId, {name, labelKz, labelRu, type, required});

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.delete('/:fieldId', async (req: any, res: any) => {

    try {

        let {fieldId} = req.params;

        let field = await fieldController.suspend(fieldId);

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router