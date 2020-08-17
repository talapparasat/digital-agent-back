import express from 'express';
import mongoose from 'mongoose';
import multer from 'multer';


import reviewController from '@controllers/review'

import socket from '@socket'

import {
    createDataValidator,
    getByIdRoleValidator,
    getAllRoleValidator,
    removeDataValidator,
    createRoleValidator,
    additionalFieldValidator,
    removeRoleValidator
} from './validators'

import {
    pagination,
    uploadFile
} from './middlewares'
import ERROR, {authErrors} from "@errors";
import {ROLES} from "@db/Role";
import isAuth from '@mw/validators/isAuth'


const router = express.Router();
const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});
const ObjectId = mongoose.Types.ObjectId;

router.get('/', getAllRoleValidator, pagination, async (req: any, res: any) => {

    try {

        // let query = req.query['query'];
        let page = req.query['page'];
        let status = req.query['status'];
        let whose = req.query['whose'];
        const {regionId, raionId, serviceProviderTypeId, phone} = req.query;

        let reviews:any;
        if (req.user.roles.includes(ROLES.SUPER_ADMIN)) {
            reviews = await reviewController.getByPage(page, status, regionId, raionId, serviceProviderTypeId, phone);
        } else if (req.user.roles.includes(ROLES.SUPERVISOR)) {
            console.log(status);
            reviews = await reviewController.getBySupervisorsServiceProviders(page, req.user._id, status);
        } else {
            if(whose === 'my'){
                reviews = await reviewController.getByOperatorId(page, req.user._id, status)
            } else {
                let serviceProvider = await req.user.getServiceProvider();

                let serviceProviderId = serviceProvider?serviceProvider._id:ObjectId();
                reviews = await reviewController.getByServiceProviderId(page, serviceProviderId, status);
            }
        }

        res.status(200).send(reviews);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.get('/:reviewId', getByIdRoleValidator, async (req: any, res: any) => {

    try {

        console.log("into get by id");

        let {reviewId} = req.params;

        const review = await reviewController.getById(reviewId, req.user.roles[0]);

        res.status(200).send(review);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.post('/', multerUpload.single('image'), isAuth, ...createDataValidator, additionalFieldValidator, uploadFile, async (req: any, res: any) => {

    try {

        let userId: any, email: string, phone: string;

        if (req.user) {
            console.log("User ID", req.user);
            userId = req.user._id;
        }
        // else if(req.body.phone) {
        //     phone = req.body.phone
        // } else if(req.body.email) {
        //     email = req.body.email
        // }
        else {
            return res.status(401).send(new ERROR(authErrors.AUTHENTICATION_REQUIRED));
        }

        let {
            text,
            rate,
            ticketNumber,
            serviceProviderId,
            serviceNameId,
            categories,
            image
        } = req.body;

        try {
            categories = JSON.parse(categories);
        } catch (e) {
            categories = []
        }


        console.log(categories);

        const review = await reviewController.create({
            text,
            rate,
            ticketNumber,
            userId,
            phone,
            email,
            serviceProviderId,
            serviceNameId,
            categories,
            image
        }, req.body);

        res.status(200).send(review);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});

router.delete('/:reviewId', ...removeDataValidator, removeRoleValidator, async (req: any, res: any) => {

    try {

        let {reviewId} = req.params;

        let result = await reviewController.remove(reviewId);

        res.status(200).send(result);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});

export default router;