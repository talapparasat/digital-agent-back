import express from 'express';
import multer from 'multer';

import profileController from '@controllers/profile'

import {
    changeEmailDataValidator,
    changePasswordDataValidator,
    changeProfileDataValidator,
    changeProfileWithEmailDataValidator,
    setPasswordDataValidator
} from './validators'

import {
    updateFile,
    parsePhone
} from './middleware'


const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router({mergeParams: true});


router.get('/', async (req: any, res: any) => {

    try {

        const user = await profileController.get(req.user._id);

        res.status(200).send(user);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.put('/', multerUpload.single('image'), updateFile, ...changeProfileDataValidator, parsePhone, async (req: any, res: any) => {

    try {

        let {name, phone, image} = req.body;

        const user = await profileController.changeProfile(req.user._id, name, phone, image);

        res.status(200).send(user);

    } catch (err) {
        res.status(400).send(err);
    }

});


//API for mobile. Edit profile with email
router.put('/edit', multerUpload.single('image'), updateFile, ...changeProfileWithEmailDataValidator, parsePhone, async (req: any, res: any) => {

    try {

        let {name, phone, image, email} = req.body;


        await profileController.changeProfileMobile(req.user._id, name, phone, image, email, req.user.phone[0]);

        res.status(200).send({success: true});

    } catch (err) {
        res.status(400).send(err);
    }

});

//Change Email
router.put('/email', ...changeEmailDataValidator, async (req: any, res: any) => {

    try {

        const user = await profileController.changeEmail(req.user._id, req.body.email);

        res.status(200).send(user);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/password', ...changePasswordDataValidator, async (req: any, res: any) => {

    try {

        const {oldPassword, newPassword} = req.body;

        const user = await profileController.changePassword(req.user._id, oldPassword, newPassword);

        res.status(200).send(user);

    } catch (err) {
        res.status(400).send(err);
    }

});

router.put('/password/set', ...setPasswordDataValidator, async (req: any, res: any) => {

    try {

        const {newPassword} = req.body;

        const user = await profileController.setPassword(req.user._id, newPassword);

        res.status(200).send(user);

    } catch (err) {
        res.status(400).send(err);
    }

});


export default router;