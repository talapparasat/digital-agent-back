import express from 'express';
import fieldController from "@controllers/field";

import {
    isOrganizationRelatedToServiceProviderType,
    isOrganizationRelatedToServiceProviderType1
} from './validators'

const router = express.Router({mergeParams: true});


router.get('/', isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;

        let fields = await fieldController.getByOsptId(osptId);

        res.status(200).send(fields);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', isOrganizationRelatedToServiceProviderType1, async (req: any, res: any) => {

    try {

        let {name, labelKz, labelRu, type, required, osptId} = req.body;

        let field = await fieldController.createAndConnect(osptId, {name, labelKz, labelRu, type, required});

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:fieldId', isOrganizationRelatedToServiceProviderType1, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;
        let {fieldId} = req.params;

        let field = await fieldController.connect(osptId, fieldId);

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.delete('/:fieldId', isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {fieldId} = req.params;
        let {osptId} = req.body;

        let field = await fieldController.suspendConnection(osptId, fieldId);

        res.status(200).send(field);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;