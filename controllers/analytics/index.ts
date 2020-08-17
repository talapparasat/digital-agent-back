import mongoose, {Types, Schema} from 'mongoose'

import Review, {STATUSES} from "@db/Review";
import ServiceProviderType from "@db/Service-provider-type";
import ServiceProvider from "@db/Service-provider";
import social from './social-networks'
import {TIME_INTERVALS} from "@config";

const ObjectId = Types.ObjectId;

const getReviewsCount = async (regionId:string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            const reviewsCount = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Reviews'
                    }
                }, {
                    '$unwind': {
                        'path': '$Reviews',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Reviews'
                    }
                }, {
                    '$facet': {
                        'all': [
                            {
                                '$count': 'total'
                            }
                        ],
                        'inProcess': [
                            {
                                '$match': {
                                    '$and': [
                                        {
                                            'rate': {
                                                '$in': [
                                                    1, 2, 3
                                                ]
                                            },
                                            'status': {
                                                '$in': [
                                                    0, 2
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }, {
                                '$count': 'total'
                            }
                        ],
                        'resolved': [
                            {
                                '$match': {
                                    '$or': [
                                        {
                                            'rate': {
                                                '$in': [
                                                    4, 5
                                                ]
                                            },
                                            'status': {
                                                '$in': [
                                                    5
                                                ]
                                            }
                                        }
                                    ]
                                }
                            }, {
                                '$count': 'total'
                            }
                        ]
                    }
                }, {
                    '$unwind': {
                        'path': '$all'
                    }
                }, {
                    '$unwind': {
                        'path': '$inProcess'
                    }
                }, {
                    '$unwind': {
                        'path': '$resolved'
                    }
                }, {
                    '$project': {
                        'all': '$all.total',
                        'inProcess': '$inProcess.total',
                        'resolved': '$resolved.total'
                    }
                }
            ]);

            // let resolvedReviewsCount = 0;
            // let inProcessReviewsCount = 0;
            //
            // reviewsCount.map(groupItem => {
            //     if (groupItem._id == 0 || groupItem._id == 2) {
            //         inProcessReviewsCount += Number.parseInt(groupItem.total)
            //     } else {
            //         resolvedReviewsCount += Number.parseInt(groupItem.total)
            //     }
            // });
            //
            // const allReviewsCount = inProcessReviewsCount + resolvedReviewsCount;
            //
            // return resolve({
            //     all: allReviewsCount,
            //     resolved: resolvedReviewsCount,
            //     inProcess: inProcessReviewsCount
            // });

            return resolve(reviewsCount[0])

        } catch (err) {
            return reject(err);
        }

    });
};


const getRaionsRating = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const raions = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$group': {
                        '_id': '$navId',
                        'rate': {
                            '$avg': '$rate'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raion',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Raion.rate': '$rate'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Raion'
                    }
                }, {
                    '$project': {
                        'nameKz': 1,
                        'nameRu': 1,
                        'rate': 1
                    }
                }, {
                    '$facet': {
                        'best': [
                            {
                                '$sort': {
                                    'rate': -1
                                }
                            }, {
                                '$limit': 10
                            }
                        ],
                        'worst': [
                            {
                                '$sort': {
                                    'rate': 1
                                }
                            }, {
                                '$limit': 10
                            }
                        ]
                    }
                }
            ]);

            return resolve(raions)

        } catch (err) {
            return reject(err);
        }

    });
};


const getRegionsRating = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const regions = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$group': {
                        '_id': '$navId',
                        'rate': {
                            '$avg': '$rate'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raion',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Raion.rate': '$rate'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Raion'
                    }
                }, {
                    '$group': {
                        '_id': '$prevId',
                        'rate': {
                            '$avg': '$rate'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Region'
                    }
                }, {
                    '$unwind': {
                        'path': '$Region',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Region.rate': '$rate'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Region'
                    }
                }, {
                    '$project': {
                        'nameKz': 1,
                        'nameRu': 1,
                        'rate': 1
                    }
                }, {
                    '$facet': {
                        'best': [
                            {
                                '$sort': {
                                    'rate': -1
                                }
                            }, {
                                '$limit': 10
                            }
                        ],
                        'worst': [
                            {
                                '$sort': {
                                    'rate': 1
                                }
                            }, {
                                '$limit': 10
                            }
                        ]
                    }
                }
            ]);

            return resolve(regions)

        } catch (err) {
            return reject(err);
        }

    });
};


const getServicesRating = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const services = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Reviews'
                    }
                }, {
                    '$unwind': {
                        'path': '$Reviews',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Reviews'
                    }
                }, {
                    '$lookup': {
                        'from': 'service-names',
                        'localField': 'serviceNameId',
                        'foreignField': '_id',
                        'as': 'Service'
                    }
                }, {
                    '$unwind': {
                        'path': '$Service',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Service.rate': '$rate'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Service'
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'nameKz': {
                            '$first': '$nameKz'
                        },
                        'nameRu': {
                            '$first': '$nameRu'
                        },
                        'rate': {
                            '$avg': '$rate'
                        }
                    }
                }, {
                    '$facet': {
                        'best': [
                            {
                                '$sort': {
                                    'rate': -1
                                }
                            }, {
                                '$limit': 10
                            }
                        ],
                        'worst': [
                            {
                                '$sort': {
                                    'rate': 1
                                }
                            }, {
                                '$limit': 10
                            }
                        ]
                    }
                }
            ]);

            return resolve(services)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingWeek = async (regionId: string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            let date = new Date();
            date.setDate(date.getDate() - 7);

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery

                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        'createdAt': {
                            '$gt': date
                        }
                    }
                }, {
                    '$addFields': {
                        'dayOfMonth': {
                            '$dateToString': {
                                'format': '%d',
                                'date': '$createdAt'
                            }
                        },
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        },
                        'year': {
                            '$dateToString': {
                                'format': '%Y',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'day': '$dayOfMonth',
                            'month': '$monthOfYear',
                            'year': '$year'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'day': '$_id.day',
                        'month': '$_id.month',
                        'year': '$_id.year',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'day': '$day',
                                'month': '$month',
                                'year': '$year',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingMonth = async (regionId: string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            let date = new Date();
            date.setMonth(date.getMonth() - 1);

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        'createdAt': {
                            '$gt': date
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$categories',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'dayOfMonth': {
                            '$dateToString': {
                                'format': '%d',
                                'date': '$createdAt'
                            }
                        },
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        },
                        'year': {
                            '$dateToString': {
                                'format': '%Y',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'day': '$dayOfMonth',
                            'month': '$monthOfYear',
                            'year': '$year'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'day': '$_id.day',
                        'month': '$_id.month',
                        'year': '$_id.year',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'day': '$day',
                                'month': '$month',
                                'year': '$year',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingYear = async (regionId: string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            let date = new Date();
            date.setFullYear(date.getFullYear() - 1);

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        'createdAt': {
                            '$gt': date
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$categories',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        },
                        'year': {
                            '$dateToString': {
                                'format': '%Y',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'month': '$monthOfYear',
                            'year': '$year'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'month': '$_id.month',
                        'year': '$_id.year',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'month': '$month',
                                'year': '$year',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingAll = async (regionId: string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$categories',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        },
                        'year': {
                            '$dateToString': {
                                'format': '%Y',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'month': '$monthOfYear',
                            'year': '$year'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'month': '$_id.month',
                        'year': '$_id.year',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'month': '$month',
                                'year': '$year',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingPeriod = async (regionId: string, raionId: string, dateFromString: string, dateToString: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            let dateFrom = new Date(dateFromString);
            let dateTo = new Date(dateToString);

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        '$and': [
                            {
                                'createdAt': {
                                    '$gt': dateFrom
                                }
                            },
                            {
                                'createdAt': {
                                    '$lt': dateTo
                                }
                            }
                        ]
                    }
                }, {
                    '$unwind': {
                        'path': '$categories',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'dayOfMonth': {
                            '$dateToString': {
                                'format': '%d',
                                'date': '$createdAt'
                            }
                        },
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        },
                        'year': {
                            '$dateToString': {
                                'format': '%Y',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'day': '$dayOfMonth',
                            'month': '$monthOfYear',
                            'year': '$year'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'day': '$_id.day',
                        'month': '$_id.month',
                        'year': '$_id.year',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'day': '$day',
                                'month': '$month',
                                'year': '$year',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getCategoriesRatingToday = async (regionId: string, raionId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            let raionQuery:any = {}, regionQuery:any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            let date = new Date();
            date.setHours(date.getHours() - 1);

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        'createdAt': {
                            '$gt': date
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$categories',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'hour': {
                            '$dateToString': {
                                'format': '%H',
                                'date': '$createdAt',
                                'timezone': "+06"
                            }
                        },
                        'dayOfMonth': {
                            '$dateToString': {
                                'format': '%d',
                                'date': '$createdAt'
                            }
                        },
                        'monthOfYear': {
                            '$dateToString': {
                                'format': '%m',
                                'date': '$createdAt'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': {
                            'rating': '$rate',
                            'hour': '$hour',
                            'day': '$dayOfMonth',
                            'month': '$monthOfYear',
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$project': {
                        'rating': '$_id.rating',
                        'hour': '$_id.hour',
                        'day': '$_id.day',
                        'month': '$_id.month',
                        '_id': 0,
                        'total': 1
                    }
                }, {
                    '$group': {
                        '_id': '$rating',
                        'data': {
                            '$push': {
                                'hour': '$hour',
                                'day': '$day',
                                'month': '$month',
                                'total': '$total'
                            }
                        }
                    }
                }
            ]);

            let result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const mapCategoryResult = (aggResult:any[]) => {

    let result:any = [
        {
            _id: new ObjectId(),
            nameRu: 'Категория 1',
            data: [],
            rating: 5
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 2',
            data: [],
            rating: 5
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 3',
            data: [],
            rating: 5
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 4',
            data: [],
            rating: 4
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 5',
            data: [],
            rating: 3
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 6',
            data: [],
            rating: 2
        },
        {
            _id: new ObjectId(),
            nameRu: 'Категория 7',
            data: [],
            rating: 1
        }
    ];

    aggResult.map((item) => {

        for(let i = 0; i < 7; i++) {
            if(item._id == result[i].rating) {
                result[i].data = item.data
            }
        }

    });

    return result

};


export = {
    getReviewsCount,
    getRaionsRating,
    getRegionsRating,
    getServicesRating,
    getCategoriesRatingYear,
    getCategoriesRatingWeek,
    getCategoriesRatingMonth,
    getCategoriesRatingAll,
    getCategoriesRatingPeriod,
    getCategoriesRatingToday,
    social: social.main
}