import express from 'express';
import surveyController from "@controllers/survey";


import {
    isOrganizationRelatedToServiceProviderType
} from './validators'

const router = express.Router();

router.post('/', isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;

        console.log(osptId);

        const questionnaire1 = await surveyController.enable(osptId);

        res.status(200).send(questionnaire1);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});


router.delete('/', isOrganizationRelatedToServiceProviderType, async (req: any, res: any) => {

    try {

        let {osptId} = req.body;

        const questionnaire = await surveyController.disable(osptId);

        res.status(200).send(questionnaire);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;