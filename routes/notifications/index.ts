import express from 'express';
import notificationController from "@controllers/notification";
import ERROR, {authErrors} from "@errors";


// import {
//
// } from './validators';

// import {  } from "./middleware";

const router = express.Router();

router.get('/', async (req: any, res: any) => {

    try {

        if(!req.user) {
            throw new ERROR(authErrors.AUTHENTICATION_REQUIRED);
        }

        let notifications = await notificationController.getMy(req.user._id);

        res.status(200).send(notifications);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:notificationId/read', async (req: any, res: any) => {

    try {

        if(!req.user) {
            throw new ERROR(authErrors.AUTHENTICATION_REQUIRED);
        }

        let {notificationId} = req.params;

        // let notification = await notificationController.read(notificationId);
        let notification = await notificationController.remove(notificationId);

        res.status(200).send(notification);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.delete('/:notificationId', async (req: any, res: any) => {

    try {

        if(!req.user) {
            throw new ERROR(authErrors.AUTHENTICATION_REQUIRED);
        }

        let {notificationId} = req.params;

        let notification = await notificationController.remove(notificationId);

        res.status(200).send(notification);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.post('/webToken', async (req: any, res: any) => {

    try {

        if(!req.user) {
            throw new ERROR(authErrors.AUTHENTICATION_REQUIRED);
        }

        let {token} = req.body;

        let result = await notificationController.setWebToken(req.user._id, token);

        res.status(200).send(result);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;