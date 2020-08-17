import dataValidator from "@mw/validators/data";
import ERROR, {authErrors, profileErrors, relationErrors} from "@errors";
import User from "@db/User";
import {Promise} from "mongoose";

export const passwordResetDataValidator = dataValidator(({body}) => [
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                email: value,
            })
                .then(user => {
                    if (!user) {
                        return Promise.reject(new ERROR(authErrors.USER_NOT_FOUND));
                    }

                    req.user = user;
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
]);

export const signUpWithEmailDataValidator = dataValidator(({body}) => [
    body('token')
        .not().isEmpty()
        .trim(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                email: value,
            })
                .then(user => {
                    if (!user) {
                        return Promise.reject(new ERROR(authErrors.USER_NOT_FOUND));
                    }

                    req.user = user;
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),
]);

export const signUpDataValidator = dataValidator(({body}) => [
    body('name')
        .not().isEmpty(),
    body('email')
        .not().isEmpty().withMessage('Email is required!')
        .isEmail().withMessage('Email is not valid!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                email: value,
            })
                .then(user => {
                    if (user) {
                        return Promise.reject(new ERROR(authErrors.EMAIL_ALREADY_IN_USE));
                    }
                });
        })
        .normalizeEmail({gmail_remove_dots: false}),

    body('phone')
        .not().isEmpty().withMessage('Phone is required!')
        .custom((value: string, {req}: any) => {
            return User.findOne({
                phone: {
                    mobile: [value]
                },
            })
                .then(user => {
                    if (user) {
                        return Promise.reject(new ERROR(authErrors.PHONE_ALREADY_IN_USE));
                    }

                    req.body.phone = {mobile: [value]};
                });
        }),

    body('password')
        .not().isEmpty(),

]);