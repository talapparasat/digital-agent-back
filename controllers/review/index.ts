import schedule from 'node-schedule'
import mongoose from "mongoose";

import Review, {ReviewProps, SEARCH_STATUSES, STATUSES} from '@db/Review'
import ServiceProvider, {ServiceProviderProps} from '@db/Service-provider'
import O_SP from '@db/Organization_Service-provider'
import S_SP from '@db/Supervisor_Service-provider'
import Notification, {NotificationProps} from "@db/Notification";
import User from '@db/User'
import Operator_ServiceProvider from '@db/Operator_Service-provider'

import {TYPES, TEXTS} from "@config/notifications"
import ERROR from "@errors"

const ObjectId = mongoose.Types.ObjectId;

import {NUMBER_OF_RESULTS_PER_PAGE, REVIEW_HISTORY_TYPES} from "@config";
import socket from "@socket";
import {ROLES} from "@db/Role";
import bus from "@modules/bus";
import firebase from '@firebase'

import mobileAdmin from './mobile-admin'
import OSPT from "@db/Organization_Service-provider-type";
import OSPT_Field from "@db/OSPT_Field";
import Review_Field from "@db/Review_Field";
import ServiceProviderType from "@db/Service-provider-type";
import Nav from "@db/Nav";

const getByPage = async (page: number, status: string, regionId: string, raionId: string, serviceProviderTypeId: string, phone: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.reviews;
            const query = getMatchQuery(status);

            let raionQuery: any = {}, regionQuery: any[] = [], phoneQuery: any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$match': {
                            'region._id': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    'ServiceProvider.navId': new ObjectId(raionId)
                }
            }

            if (phone) {
                phoneQuery = [
                    {
                        '$lookup': {
                            'from': 'users',
                            'localField': 'userId',
                            'foreignField': '_id',
                            'as': 'User'
                        }
                    }, {
                        '$unwind': {
                            'path': '$User',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'User.phone.mobile': {
                                "$regex": phone,
                                "$options": "i"
                            }
                        }
                    }
                ]
            }

            let reviews = await Review.aggregate([
                {
                    $match: {
                        ...query
                    }
                },
                ...phoneQuery,
                {
                    $sort: {
                        createdAt: -1
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'localField': 'serviceProviderId',
                        'foreignField': '_id',
                        'as': 'ServiceProvider'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceProvider'
                    }
                }, {
                    '$match': {
                        ...serviceProviderTypeId ? {'ServiceProvider.serviceProviderTypeId': new ObjectId(serviceProviderTypeId)} : {},
                        'ServiceProvider.suspended': false,
                        ...raionQuery
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'ServiceProvider.navId',
                        'foreignField': '_id',
                        'as': 'raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$raion'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'raion.prevId',
                        'foreignField': '_id',
                        'as': 'region'
                    }
                }, {
                    '$unwind': {
                        'path': '$region'
                    }
                },
                ...regionQuery,
                {
                    '$facet': {
                        metadata: [
                            {$count: "total"},

                            {
                                $addFields:
                                    {
                                        total: "$total",
                                        currentPage: page
                                    }
                            }
                        ],

                        reviews: [
                            {$skip: Math.ceil((page - 1) * limit)}, {$limit: limit}
                        ]
                    }
                }, {
                    $unwind: "$metadata"
                }, {
                    $addFields: {
                        pageSize: limit
                    }
                }, {
                    $project: {
                        reviews: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(reviews[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByOperatorId = async (page: number, operatorId: string, status: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.reviews;
            const query = getMatchQuery(status);

            const count = await Review.find({
                ...query,
                operatorId: operatorId,
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);

            let reviews = await Review.find(
                {
                    ...query,
                    operatorId: operatorId,
                    suspended: false
                })
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit);

            return resolve({reviews, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err);
        }

    });
};


const getBySupervisorsServiceProviders = async (page: number, supervisorId: string, status: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.reviews;
            const query = getMatchQuery(status);

            const reviews = await S_SP.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(supervisorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'localField': 'serviceProviderId',
                        'foreignField': '_id',
                        'as': 'ServiceProvider'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceProvider'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'ServiceProvider.navId',
                        'foreignField': '_id',
                        'as': 'Raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raion'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'Raion.prevId',
                        'foreignField': '_id',
                        'as': 'Region'
                    }
                }, {
                    '$unwind': {
                        'path': '$Region'
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': 'serviceProviderId',
                        'foreignField': 'serviceProviderId',
                        'as': 'Reviews'
                    }
                }, {
                    '$unwind': {
                        'path': '$Reviews'
                    }
                }, {
                    '$addFields': {
                        'Reviews.raion': '$Raion',
                        'Reviews.region': '$Region'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Reviews'
                    }
                }, {
                    $match: {
                        ...query
                    }
                }, {
                    $sort: {
                        createdAt: -1
                    }
                }, {
                    '$addFields': {
                        'categoryIds': {
                            '$map': {
                                'input': '$categories',
                                'as': 'category',
                                'in': '$$category.categoryId'
                            }
                        }
                    }
                }, {
                    '$addFields': {
                        'categoryIds': {
                            '$ifNull': ['$categoryIds', []]
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'service-categories',
                        'let': {
                            'categoryIds': '$categoryIds',
                            'categories': '$categories'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$in': [
                                            '$_id', '$$categoryIds'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$addFields': {
                                    'category': {
                                        '$filter': {
                                            'input': '$$categories',
                                            'as': 'cat',
                                            'cond': {
                                                '$eq': [
                                                    '$$cat.categoryId', '$_id'
                                                ]
                                            }
                                        }
                                    }
                                }
                            }, {
                                '$unwind': {
                                    'path': '$category',
                                    'preserveNullAndEmptyArrays': true
                                }
                            }, {
                                '$lookup': {
                                    'from': 'service-criterias',
                                    'let': {
                                        'criteriaIds': '$category.criterias'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                'suspended': false,
                                                '$expr': {
                                                    '$in': [
                                                        '$_id', '$$criteriaIds'
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    'as': 'criterias'
                                }
                            }, {
                                '$project': {
                                    'category': 0
                                }
                            }
                        ],
                        'as': 'categories'
                    }
                }, {
                    '$project': {
                        'categoryIds': 0
                    }
                }, {
                    '$facet': {
                        metadata: [
                            {$count: "total"},

                            {
                                $addFields:
                                    {
                                        total: "$total",
                                        currentPage: page
                                    }
                            }
                        ],

                        reviews: [
                            {
                                '$lookup': {
                                    'from': 'service-providers',
                                    'localField': 'serviceProviderId',
                                    'foreignField': '_id',
                                    'as': 'ServiceProvider'
                                }
                            }, {
                                '$unwind': {
                                    'path': '$ServiceProvider'
                                }
                            },
                            {$skip: Math.ceil((page - 1) * limit)}, {$limit: limit}
                        ]
                    }
                }, {
                    $unwind: "$metadata"
                }, {
                    $addFields: {
                        pageSize: limit
                    }
                }, {
                    $project: {
                        reviews: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(reviews[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByServiceProviderId = async (page: number, serviceProviderId: string, status: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.reviews;
            const query = getMatchQuery(status);

            const count = await Review.find({
                ...query,
                serviceProviderId: serviceProviderId,
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);

            let reviews = await Review.find(
                {
                    ...query,
                    serviceProviderId: serviceProviderId,
                    suspended: false,
                })
                .sort({createdAt: -1})
                .skip(skip)
                .limit(limit);

            return resolve({reviews, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err);
        }

    });
};

const getById = async (reviewId: string, role: string = ROLES.OPERATOR) => {

    return new Promise(async (resolve, reject) => {

        try {

            let result: any;
            // let review = await Review.findById(reviewId);
            let review: any = await Review.aggregate([
                {
                    $match: {
                        '_id': ObjectId(reviewId)
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'let': {
                            'operatorId': '$operatorId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': ['$_id', '$$operatorId']
                                    }
                                }
                            },
                            {
                                $project: {
                                    name: 1,
                                    image: 1
                                }
                            }
                        ],
                        'as': 'Operator'
                    }
                }, {
                    '$addFields': {
                        'categoryIds': {
                            '$map': {
                                'input': '$categories',
                                'as': 'category',
                                'in': '$$category.categoryId'
                            }
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'service-categories',
                        'let': {
                            'categoryIds': '$categoryIds',
                            'categories': '$categories'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$in': [
                                            '$_id', '$$categoryIds'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$addFields': {
                                    'category': {
                                        '$filter': {
                                            'input': '$$categories',
                                            'as': 'cat',
                                            'cond': {
                                                '$eq': [
                                                    '$$cat.categoryId', '$_id'
                                                ]
                                            }
                                        }
                                    }
                                }
                            }, {
                                '$unwind': {
                                    'path': '$category',
                                    'preserveNullAndEmptyArrays': true
                                }
                            }, {
                                '$lookup': {
                                    'from': 'service-criterias',
                                    'let': {
                                        'criteriaIds': '$category.criterias'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                'suspended': false,
                                                '$expr': {
                                                    '$in': [
                                                        '$_id', '$$criteriaIds'
                                                    ]
                                                }
                                            }
                                        }
                                    ],
                                    'as': 'criterias'
                                }
                            }, {
                                '$project': {
                                    'category': 0
                                }
                            }
                        ],
                        'as': 'categories'
                    }
                }, {
                    '$project': {
                        'categoryIds': 0
                    }
                }
            ]);

            review = review[0];

            result = {
                review
            };

            let user: any;

            if (review.userId) {
                user = await User.findById(review.userId, 'name email phone');
                result.User = user;
            }


            if (role === ROLES.SUPERVISOR || role === ROLES.SUPER_ADMIN) {


                let serviceProvider: any;
                let operator: any;

                serviceProvider = await ServiceProvider.findById(review.serviceProviderId);
                operator = await User.findById(review.operatorId, '-hash -salt -__v -suspended -isVerified');

                result.ServiceProvider = serviceProvider;
                result.Operator = operator;
            }

            if (role === ROLES.SUPER_ADMIN) {


                let organization: any;

                let organization_ServiceProvider = await O_SP.findOne({
                    serviceProviderId: review.serviceProviderId
                }).populateTs('organizationId');

                organization = organization_ServiceProvider ? organization_ServiceProvider.organizationId : null;
                result.Organization = organization;
            }


            return resolve(result);

        } catch (err) {
            return reject(err);
        }

    });
};


const create = async ({text, rate, ticketNumber, userId, phone, email, image, serviceProviderId, serviceNameId, categories}: ReviewProps, fields: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log("Income user id", userId);
            console.log("Income user phone", phone);
            console.log("Income user email", email);

            let operators = await Operator_ServiceProvider.aggregate(
                [
                    {
                        '$match': {
                            'serviceProviderId': new ObjectId(serviceProviderId)
                        }
                    }, {
                    '$lookup': {
                        'from': 'users',
                        'localField': 'userId',
                        'foreignField': '_id',
                        'as': 'Operator'
                    }
                }, {
                    '$unwind': {
                        'path': '$Operator'
                    }
                }, {
                    '$project': {
                        '_id': '$Operator._id',
                        'name': '$Operator.name',
                        'email': '$Operator.email',
                        'phone': '$Operator.phone',
                        'lastReviewTime': '$Operator.lastReviewTime',
                        'webTokens': '$Operator.webTokens'
                    }
                }
                ]
            );

            console.log(operators);

            if (operators.length == 0) {
                throw new ERROR("У этого услугодателя временно нет контактных лиц для обработки жалоб")
            }

            let operator = operators.reduce((minOperator, currentOperator) => {
                if (!minOperator.lastReviewTime) {
                    return minOperator
                } else if (!currentOperator.lastReviewTime) {
                    return currentOperator
                } else {
                    return minOperator.lastReviewTime > currentOperator.lastReviewTime ? currentOperator : minOperator
                }
            });

            console.log('Before', operator);

            await User.findByIdAndUpdate(operator._id, {
                lastReviewTime: Date.now()
            });

            console.log('After', operator);

            let status = STATUSES.SENT_TO_OPERATOR;
            if (rate == 4 || rate == 5) {
                status = STATUSES.RESOLVED
            }

            let review = new Review({
                text,
                rate,
                ticketNumber,
                ...userId ? {userId} : [],
                ...phone ? {phone} : [],
                ...email ? {email} : [],
                ...image ? {image}: {},
                serviceProviderId,
                serviceNameId,
                operatorId: operator._id,
                categories,
                status
            });

            await review.save();

            console.log(operator.email);

            // socket.io.of('/').in(operator.email).clients((err:any, clients:any) => {
            //     console.log(clients) // an array of socket ids
            // });

            let serviceProvider = await ServiceProvider.findById(serviceProviderId);

            await saveAdditionalFields(fields, review._id, serviceProvider);


            // bus.emit('event.review.created', {
            //     text: 'Поступил новый отзыв',
            //     type: 'Новый отзыв',
            //     to: operator._id,
            //     sourceId: review._id
            // });

            let notification = await createNotification({
                title: TEXTS.NEW_REVIEW.title,
                body: TEXTS.NEW_REVIEW.body,
                type: TYPES.REVIEW,
                to: operator._id,
                sourceId: review._id
            });

            let isWaiting = true;

            if (isWorkHours(serviceProvider)) {
                console.log("into sending");
                socket.io.sockets.to(operator._id).emit("notification.received", notification);
                socket.io.sockets.to(serviceProviderId).emit("Review.created", review);
                isWaiting = false;

                bus.emit('event.review.status.changed', {
                    reviewId: review._id,
                    type: REVIEW_HISTORY_TYPES.ACTIVE
                });
            } else {
                bus.emit('event.review.status.changed', {
                    reviewId: review._id,
                    type: REVIEW_HISTORY_TYPES.NEW
                });

                socket.io.sockets.to(operator._id).emit("notification.received", notification);
                socket.io.sockets.to(serviceProviderId).emit("Review.created", review);
            }

            console.log({tokens: operator.webTokens});

            if(operator.webTokens && operator.webTokens.length > 0) {
                firebase.sendWebPush(
                    notification.title,
                    notification.body,
                    notification.type,
                    operator.webTokens,
                    notification.sourceId
                );
            }



            // let date = new Date();
            // date.setSeconds(date.getSeconds() + 5);

            // var x = 'Tada!';

            // let j = schedule.scheduleJob(date, async function(){
            //
            //     console.log("Job is executing");
            //     let updatedReview = await Review.findByIdAndUpdate(review._id, {
            //         status: 2
            //     }, {new: true});
            //
            //     console.log(updatedReview);
            // });

            // console.log("After job executing");

            // }.bind(null,x));
            // x = 'Changing Data';

            rate = Number(rate);


            let newRate = (serviceProvider.rate * serviceProvider.reviewCount + rate) / (serviceProvider.reviewCount + 1);
            let rateDelta = newRate - serviceProvider.rate;

            ServiceProvider.findByIdAndUpdate(serviceProviderId, {
                rate: newRate,
                reviewCount: serviceProvider.reviewCount + 1
            });

            return resolve({review, change: rateDelta, isWaiting});

        } catch (err) {
            return reject(err);
        }

    });
};

//Используется на админке в мобильном приложении
const getReviewCountByStatus = async (status: number[], serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const count = await Review.find({
                status: {
                    $in: status
                },
                serviceProviderId
            }).countDocuments();

            return resolve(count);

        } catch (err) {
            return reject(err);
        }

    });
};


const getLastReviewsByStatus = async (status: number[], serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(typeof serviceProviderId.toString());

            const reviews = await Review.aggregate([
                {
                    '$match': {
                        'status': {
                            '$in': status
                        },
                        'serviceProviderId': ObjectId(serviceProviderId.toString())
                    }
                }, {
                    '$project': {
                        'rate': 1,
                        'createdAt': 1,
                        'operatorId': 1,
                        'userId': 1
                    }
                }, {
                    '$sort': {
                        'createdAt': -1
                    }
                }, {
                    '$limit': 4
                }, {
                    $lookup: {
                        from: "users",
                        let: {"userId": "$userId"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', "$$userId"]
                                    }
                                }
                            },
                            {
                                $project: {
                                    'name': 1,
                                    'phone': 1,
                                    'email': 1,
                                    'image': 1
                                }
                            }
                        ],
                        as: "User"
                    }
                },
                {
                    $unwind: {
                        path: "$User",
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'let': {
                            'userId': '$operatorId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$userId'
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    'name': 1,
                                    'phone': 1,
                                    'email': 1,
                                    'image': 1
                                }
                            }
                        ],
                        'as': 'ContactPerson'
                    }
                }, {
                    '$unwind': {
                        'path': '$ContactPerson'
                    }
                }
            ]);

            return resolve(reviews);

        } catch (err) {
            return reject(err);
        }

    });
};


const remove = async (reviewId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let review = await Review.findById(reviewId);

            if (!review) {
                return reject({success: false})
            }

            let serviceProvider = await ServiceProvider.findById(review.serviceProviderId);

            let newRate = ((serviceProvider.rate * serviceProvider.reviewCount) - review.rate) / (serviceProvider.reviewCount - 1);

            await ServiceProvider.updateOne({
                _id: serviceProvider._id
            }, {
                $set: {
                    rate: newRate,
                    reviewCount: serviceProvider.reviewCount - 1
                }
            });

            await Review_Field.deleteMany({
                reviewId
            });

            await Notification.deleteMany({
                sourceId: review._id
            });

            await Review.deleteOne({
                _id: review._id
            });

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};


const createNotification = async ({title, body, type, to, sourceId}: NotificationProps) => {

    let notification = new Notification({
        title,
        body,
        type,
        to,
        sourceId
    });

    await notification.save();

    return notification;
};


const isWorkHours = (serviceProvider: ServiceProviderProps) => {

    let workHours = serviceProvider.workHours;

    let date = new Date();

    let day = date.getDay();


    // date.setTime(date.getTime() + 360 * 60 * 1000);

    let workHoursOfDay = workHours[day - 1];

    if (!workHoursOfDay) {
        return true
    }

    if (!workHoursOfDay.isWorkDay) {
        return false
    }

    let workTimeStart = Number.parseInt(workHoursOfDay.start.split(':')[0]) * 60 +
        Number.parseInt(workHoursOfDay.start.split(':')[1]);

    let workTimeEnd = Number.parseInt(workHoursOfDay.end.split(':')[0]) * 60 +
        Number.parseInt(workHoursOfDay.end.split(':')[1]);

    let timeNow = date.getHours() * 60 + date.getMinutes();

    if (workTimeStart > timeNow || workTimeEnd < timeNow) {
        return false
    } else {
        return true
    }

};


const saveAdditionalFields = async (reqFields: any, reviewId: string, serviceProvider: any) => {
    try {

        const osp = await O_SP.findOne({
            serviceProviderId: serviceProvider._id
        });

        const organizationId = osp.organizationId;
        const serviceProviderTypeId = serviceProvider.serviceProviderTypeId;

        const ospt = await OSPT.findOne({
            organizationId,
            serviceProviderTypeId
        });

        console.log({ospt});

        const fields = await OSPT_Field.aggregate([
            {
                $match: {
                    osptId: ospt._id,
                    suspended: false
                }
            },
            {
                $lookup: {
                    from: 'fields',
                    localField: 'fieldId',
                    foreignField: '_id',
                    as: 'Field'
                }
            },
            {
                $unwind: '$Field'
            },
            {
                $replaceRoot: {
                    newRoot: '$Field'
                }
            }
        ]);


        const results = await Promise.all(
            fields.map((field, index: number) => createReviewField(field, index, null, reqFields, reviewId))
        );

        return results;

    } catch (err) {
        throw err
    }
};


const createReviewField = async (field: any, index: number, session: any, fields: any, reviewId: string) => {

    return new Promise(async (resolve, reject) => {

        try {
            console.log({index});
            console.log({field});
            console.log({fields});

            if (!fields[field._id]) {
                return resolve()
            }

            const newReviewField = new Review_Field({
                reviewId,
                fieldId: field._id,
                value: fields[field._id]
            });

            await newReviewField.save();

            return resolve(newReviewField)
        } catch (err) {
            return reject(err)
        }
    })

};

const getMatchQuery = (status: string) => {
    let query = {};

    switch (status) {
        case 'ACTIVE':
            query = {
                status: {
                    $in: SEARCH_STATUSES.ACTIVE
                },
                rate: {
                    $in: [1, 2, 3]
                }
            };
            break;

        case 'RESOLVED':
            query = {
                status: {
                    $in: SEARCH_STATUSES.RESOLVED
                },
                rate: {
                    $in: [1, 2, 3]
                }
            };
            break;

        case 'POSITIVE':
            query = {
                rate: {
                    $in: [4, 5]
                }
            };
            break;
    }

    return query
};


// const getLeftTimeToNextWorkHours = (serviceProvider: ServiceProviderProps) => {
//
//     let workHours = serviceProvider.workHours;
//
//     let date = new Date();
//
//     let day = date.getDay();
//
//     let arr:any = [];
//     let temp = day - 1;
//
//     for (let i = 0; i < 7; i++) {
//         arr.push(temp);
//
//         temp++;
//
//         temp = temp % 7;
//     }
//
//     if (!(workHoursOfDay.start || workHoursOfDay.end)) {
//         return true
//     }
//
//
//     let result:number = 0;
//
//     for (let i = arr[0]; i < 7; i++) {
//
//         let workHoursOfDay = workHours[day - 1];
//
//         let workTimeStart = workHoursOfDay.start.getHours() * 60 + workHoursOfDay.start.getMinutes();
//         let timeNow = date.getHours() * 60 + date.getMinutes();
//
//         if (workTimeStart > timeNow) {
//             result = result + workTimeStart - timeNow;
//             break
//         } else {
//
//         }
//     }
//
//
//     if (date.getTime() > workHoursOfDay.start.getTime()) {
//
//     }
//
// };


export = {
    getByPage,
    getBySupervisorsServiceProviders,
    getByServiceProviderId,
    getByOperatorId,
    getById,
    getReviewCountByStatus,
    getLastReviewsByStatus,
    create,
    remove,
    ...mobileAdmin
}