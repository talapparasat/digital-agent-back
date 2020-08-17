import express from 'express';

import exportationController from '@controllers/exportation'
import {ROLES} from "@db/Role";
import {authErrors} from "@errors";

const router = express.Router();

router.get('/reviews', async (req: any, res: any) => {
    try {

        let file;

        if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
            file = await exportationController.getReviews();
        } else if(req.user.roles.includes(ROLES.SUPERVISOR)) {
            file = await exportationController.getReviews(req.user._id);
        } else {
            throw new Error(authErrors.PERMISSION_REQUIRED)
        }

        // @ts-ignore
        file.write('Отзывы.xlsx', res);

    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
});


router.get('/service-providers', async (req: any, res: any) => {
    try {

        let file;
        if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
            file = await exportationController.getServiceProviders();
        } else if(req.user.roles.includes(ROLES.SUPERVISOR)) {
            file = await exportationController.getServiceProviders(req.user._id);
        } else {
            throw new Error(authErrors.PERMISSION_REQUIRED)
        }
        // @ts-ignore
        file.write('Услугодатели.xlsx', res);

    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
});

router.get('/analytics', async (req: any, res: any) => {
    try {

        const {regionId, raionId, period, dateFrom, dateTo} = req.query;

        const file = await exportationController.getAnalytics(regionId, raionId, period, dateFrom, dateTo);

        // @ts-ignore
        file.write('Аналитика.xlsx', res);

    } catch (err) {
        console.log(err);
        res.status(400).send(err)
    }
});

export default router;
