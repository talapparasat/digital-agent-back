import UserOrganization from '@db/User-organization';
import ERROR, {authErrors, relationErrors, profileErrors} from "@errors";
import dataValidator from "@mw/validators/data";
import {ROLES} from '@db/Role';
import User from "@db/User";
import {Promise} from "mongoose";



export const changePasswordDataValidator = dataValidator(({body}) => [
    body('oldPassword')
        .not().isEmpty()
        .trim(),
    body('newPassword')
        .not().isEmpty()
        .trim()
]);


export const setPasswordDataValidator = dataValidator(({body}) => [
    body('newPassword')
        .not().isEmpty()
        .trim()
]);


export const changeEmailDataValidator = dataValidator(({body}) => [
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                email: value,
                _id: { $ne: req.user._id }
            })
                .then(user => {
                    if (user) {
                        return Promise.reject(new ERROR(profileErrors.EMAIL_ALREADY_IN_USE));
                    }
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
]);


export const changeProfileDataValidator = dataValidator(({body}) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('phone')
        .not().isEmpty()
        .trim(),
    body('image')
        .not().isEmpty()
        .trim()
]);


export const changeProfileWithEmailDataValidator = dataValidator(({body}) => [
    body('name')
        .not().isEmpty()
        .trim(),
    body('phone')
        .not().isEmpty()
        .trim(),
    body('image')
        .not().isEmpty()
        .trim(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                email: value,
                _id: { $ne: req.user._id }
            })
                .then(user => {
                    if (user) {
                        return Promise.reject(new ERROR(profileErrors.EMAIL_ALREADY_IN_USE));
                    }
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
]);
