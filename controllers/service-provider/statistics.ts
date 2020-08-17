import ServiceProvider from '@db/Service-provider';
import Review from '@db/Review';
import OSP from "@db/Organization_Service-provider";
import {Schema, Types} from "mongoose";
import ObjectId = Types.ObjectId;
import {TIME_INTERVALS} from "@config";
// type ObjectId = Types.ObjectId;

const getRatesCountByGroup = async (serviceProviderId: ObjectId) => {

    return new Promise(async (resolve, reject) => {

        try {

            const ratesCount = await Review.aggregate([
                {
                    $match: {
                        serviceProviderId
                    }
                },
                {
                    $group: {
                        _id: '$rate',
                        count: {
                            $sum: 1
                        }
                    }
                },
                // {
                //     $project: {
                //         _id: 0,
                //         rate: '$_id',
                //         count: '$count'
                //     }
                // }
            ]);

            let result: any = {};

            ratesCount.map(item => {
                result[item._id] = item.count
            });

            return resolve(result);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTotalReviews = async (serviceProviderId: ObjectId) => {

    return new Promise(async (resolve, reject) => {

        try {

            const totalReviews = await Review.find({
                serviceProviderId: serviceProviderId
            }).countDocuments();

            return resolve(totalReviews);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTopServiceProvidersByPeriod = async (serviceProviderTypeId: string, organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let topServiceProviders = OSP.aggregate([
                {
                    '$match': {
                        'organizationId': new ObjectId(organizationId)
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'let': {
                            'serviceProviderId': '$serviceProviderId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$serviceProviderId'
                                        ]
                                    },
                                    'serviceProviderTypeId': new ObjectId(serviceProviderTypeId)
                                }
                            }
                        ],
                        'as': 'ServiceProvider'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceProvider',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$ServiceProvider'
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'let': {
                            'serviceProviderId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$serviceProviderId', '$$serviceProviderId'
                                        ]
                                    },
                                    'createdAt': {
                                        '$gt': new Date('Fri, 10 Jan 2020 00:00:00 GMT')
                                    }
                                }
                            }
                        ],
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'nameRu': {
                            '$first': '$nameRu'
                        },
                        'nameKz': {
                            '$first': '$nameKz'
                        },
                        'avg': {
                            '$avg': '$Review.rate'
                        }
                    }
                }, {
                    '$sort': {
                        'avg': -1
                    }
                }, {
                    '$limit': 3
                }
            ]);

            return resolve(topServiceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTopServiceProvidersByOrganizationAndTypeId = async (serviceProviderTypeId: string, organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let topServiceProviders = OSP.aggregate([
                {
                    '$match': {
                        'organizationId': new ObjectId(organizationId)
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'let': {
                            'serviceProviderId': '$serviceProviderId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$serviceProviderId'
                                        ]
                                    },
                                    'serviceProviderTypeId': new ObjectId(serviceProviderTypeId)
                                }
                            }, {
                                '$project': {
                                    'nameRu': 1,
                                    'nameKz': 1,
                                    'rate': 1
                                }
                            }
                        ],
                        'as': 'ServiceProvider'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceProvider',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$ServiceProvider'
                    }
                }, {
                    '$sort': {
                        'rate': -1
                    }
                }, {
                    '$limit': 3
                }
            ]);

            return resolve(topServiceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const getServiceProviderAverageRatingByTimeInterval = async (serviceProviderId: ObjectId, interval: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            let date = new Date();
            let groupFieldName: any;

            switch (interval) {
                case TIME_INTERVALS.WEEK:
                    date.setDate(date.getDate() - 7);
                    groupFieldName = "$dayOfWeek";
                    break;

                case TIME_INTERVALS.MONTH:
                    date.setMonth(date.getMonth() - 1);
                    groupFieldName = "$dayOfMonth";
                    break;

                case TIME_INTERVALS.YEAR:
                    date.setFullYear(date.getFullYear() - 1);
                    groupFieldName = "$monthOfYear";
                    break;
                default:
                    date.setDate(date.getDate() - 7);
                    groupFieldName = "$dayOfWeek";
                    break;
            }

            console.log(date);

            const avgRatingPerGroup = await Review.aggregate([
                {
                    '$match': {
                        'serviceProviderId': new ObjectId(serviceProviderId),
                        'createdAt': {
                            '$gt': date
                        }
                    }
                }, {
                    '$addFields': {
                        'dayOfWeek': {
                            '$dateToString': {
                                'format': '%w',
                                'date': '$createdAt'
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
                        '_id': groupFieldName,
                        'avg': {
                            '$avg': '$rate'
                        },
                        // 'data': {
                        //     '$push': '$$ROOT'
                        // }
                    }
                }
            ]);

            let result: any = {};

            avgRatingPerGroup.map(item => {
                result[item._id] = item.avg
            });

            return resolve(result);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    getTotalReviews,
    getRatesCountByGroup,
    getTopServiceProvidersByPeriod,
    getServiceProviderAverageRatingByTimeInterval,
    getTopServiceProvidersByOrganizationAndTypeId
}