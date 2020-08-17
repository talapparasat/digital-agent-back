import mongoose, {Types} from "mongoose"
import UserRole from "@db/User-role";
import User from "@db/User";
import Role, {ROLES} from "@db/Role";
import ServiceProvider, {ServiceProviderProps} from "@db/Service-provider"
import Supervisor_ServiceProvider from "@db/Supervisor_Service-provider"
import Review, {STATUSES} from "@db/Review";
import Nav from "@db/Nav";
import ERROR from "@errors";
const ObjectId = mongoose.Types.ObjectId;

const getUsersCountByRole = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const contactPersonsCount = await getContactPersonsCount(supervisorId);
            const usersCount = await getUsersCount();

            return resolve({
                contactPersonsCount,
                usersCount
            });

        } catch (err) {
            return reject(err);
        }

    });
};


const getUsersCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const userRolesCount = await UserRole.countDocuments();

            const usersCount = await User.countDocuments();

            const count = usersCount - userRolesCount;


            return resolve(count);

        } catch (err) {
            return reject(err);
        }

    });
};


const getContactPersonsCount = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const result = await Supervisor_ServiceProvider.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(supervisorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'operator_service-providers',
                        'localField': 'serviceProviderId',
                        'foreignField': 'serviceProviderId',
                        'as': 'OSP'
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'total': {
                            '$sum': {
                                '$size': '$OSP'
                            }
                        }
                    }
                }
            ]);

            const contactPersonsCount = result[0].total;

            return resolve(contactPersonsCount);

        } catch (err) {
            console.log(err);
            return reject(err);
        }

    });
};


const getServiceProvidersCount = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderCount = await Supervisor_ServiceProvider.find({
                userId: supervisorId,
            }).countDocuments();

            return resolve(serviceProviderCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getReviewsCount = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const reviewsCount = await Supervisor_ServiceProvider.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(supervisorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': 'serviceProviderId',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$group': {
                        '_id': '$Review.status',
                        'total': {
                            '$sum': 1
                        }
                    }
                }
            ]);

            let resolvedReviewsCount = 0;
            let inProcessReviewsCount = 0;

            reviewsCount.map(groupItem => {
                if(groupItem._id == 0 || groupItem._id == 2) {
                    inProcessReviewsCount += Number.parseInt(groupItem.total)
                } else {
                    resolvedReviewsCount += Number.parseInt(groupItem.total)
                }
            });

            const allReviewsCount = inProcessReviewsCount + resolvedReviewsCount;

            return resolve({
                all: allReviewsCount,
                resolved: resolvedReviewsCount,
                inProcess: inProcessReviewsCount
            });

        } catch (err) {
            console.log(err);
            return reject(err);
        }

    });
};


const getAverageRating = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let avgRating = await Supervisor_ServiceProvider.aggregate([
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
                        'path': '$ServiceProvider',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$ServiceProvider'
                    }
                }, {
                    '$addFields': {
                        'rateToAvg': {
                            '$cond': {
                                'if': {
                                    '$eq': [
                                        '$rate', 0
                                    ]
                                },
                                'then': null,
                                'else': '$rate'
                            }
                        }
                    }
                }, {
                    '$group': {
                        '_id': null,
                        'avgRate': {
                            '$avg': '$rateToAvg'
                        }
                    }
                },
            ]);

            return resolve(avgRating[0].avgRate);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTotalServiceProvidersByRegions = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const totalServiceProviders = await Supervisor_ServiceProvider.aggregate([
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
                        'path': '$ServiceProvider',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$ServiceProvider'
                    }
                }, {
                    '$match': {
                        'suspended': false
                    }
                }, {
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
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'Raion.prevId',
                        'foreignField': '_id',
                        'as': 'Region'
                    }
                }, {
                    '$unwind': {
                        'path': '$Region',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$group': {
                        '_id': '$Region',
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$sort': {
                        'total': -1
                    }
                }
            ]);

            return resolve(totalServiceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTotalReviewCountByRegions = async (supervisorId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const totalReviewsByRegions = await Nav.aggregate([
                {
                    '$match': {
                        'prevId': null
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': 'prevId',
                        'as': 'Raions'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raions',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'localField': 'Raions._id',
                        'foreignField': 'navId',
                        'as': 'ServiceProvider'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceProvider',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$lookup': {
                        'from': 'supervisor_service-providers',
                        'localField': 'ServiceProvider._id',
                        'foreignField': 'serviceProviderId',
                        'as': 'S_SP'
                    }
                }, {
                    '$unwind': {
                        'path': '$S_SP',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$match': {
                        'S_SP.userId': new ObjectId(supervisorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': 'ServiceProvider._id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Reviews'
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
                        'coordinates': {
                            '$first': '$coordinates'
                        },
                        'totalReviews': {
                            '$sum': {
                                '$size': '$Reviews'
                            }
                        }
                    }
                }, {
                    '$sort': {
                        'totalReviews': -1
                    }
                }, {
                    '$limit': 5
                }
            ]);

            return resolve(totalReviewsByRegions);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    getUsersCountByRole,
    getServiceProvidersCount,
    getReviewsCount,
    getAverageRating,
    getTotalServiceProvidersByRegions,
    getTotalReviewCountByRegions
}