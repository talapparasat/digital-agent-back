import OrganizationServiceProviderType from "@db/Organization_Service-provider-type";
import User from "@db/User"
import UserRole from "@db/User-role"
import ServiceProvider from "@db/Service-provider"
import Organization from "@db/Organization"
import Nav from "@db/Nav"
import Review, {STATUSES} from "@db/Review"
import Role, {ROLES} from "@db/Role"


const getUsersCountByRole = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const adminsCount = await getAdminsCount();
            const supervisorCount = await getSupervisorsCount();
            const contactPersonsCount = await getContactPersonsCount();
            const usersCount = await getUsersCount();


            return resolve({
                adminsCount,
                supervisorCount,
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


            // const userCountResult = await User.aggregate([
            //     {
            //         $lookup: {
            //             from: "user-roles",
            //             localField: "_id",
            //             foreignField: "userId",
            //             as: "UserRole"
            //         }
            //     }, {
            //         $match: {
            //             UserRole: {$eq: []}
            //         }
            //     }, {
            //         $count: 'total'
            //     }
            // ]);

            // const count = userCountResult[0].total;

            const count = usersCount - userRolesCount;


            return resolve(count);

        } catch (err) {
            return reject(err);
        }

    });
};


const getAdminsCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const role = await Role.findOne({
                name: ROLES.ADMIN
            });

            const adminsCount = await UserRole.find({
                roleId: role._id,
                suspended: false
            }).countDocuments();

            return resolve(adminsCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getSupervisorsCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const role = await Role.findOne({
                name: ROLES.SUPERVISOR
            });

            const supervisorsCount = await UserRole.find({
                roleId: role._id,
                suspended: false
            }).countDocuments();

            return resolve(supervisorsCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getContactPersonsCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const role = await Role.findOne({
                name: ROLES.OPERATOR
            });

            const contactPersonsCount = await UserRole.find({
                roleId: role._id,
                suspended: false
            }).countDocuments();

            return resolve(contactPersonsCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getServiceProvidersCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderCount = await ServiceProvider.find({
                suspended: false
            }).countDocuments();

            return resolve(serviceProviderCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getOrganizationCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const organizationCount = await Organization.find({
                suspended: false
            }).countDocuments();

            return resolve(organizationCount);

        } catch (err) {
            return reject(err);
        }

    });
};


const getReviewsCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const allReviewsCount = await Review.countDocuments();

            const resolvedReviewsCount = await Review.find({
                $or: [
                    {
                        status: {
                            $in: [STATUSES.RESOLVED]
                        }
                    },
                    {
                        rate: {
                            $in: [4, 5]
                        }
                    }
                ]

            }).countDocuments();

            const inProcessReviewsCount = await Review.find({
                $and: [
                    {
                        status: {
                            $in: [STATUSES.SENT_TO_OPERATOR, STATUSES.SENT_TO_SUPERVISOR]
                        }
                    },
                    {
                        rate: {
                            $in: [1, 2, 3]
                        }
                    }
                ]

            }).countDocuments();

            return resolve({
                all: allReviewsCount,
                resolved: resolvedReviewsCount,
                inProcess: inProcessReviewsCount
            });

        } catch (err) {
            return reject(err);
        }

    });
};


const getTotalServiceProvidersByRegions = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            const totalServiceProviders = await ServiceProvider.aggregate([
                {
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
                    $sort: {
                        total: -1
                    }
                }
            ]);

            return resolve(totalServiceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const getTotalReviewCountByRegions = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            // let regions = await Nav.aggregate([
            //     {
            //         $match: {
            //             prevId: null
            //         }
            //     },
            //     {
            //         $lookup: {
            //             from: 'navs',
            //             localField: '_id',
            //             foreignField: 'prevId',
            //             as: 'Raions'
            //         }
            //     }
            // ]);
            //
            // regions.map(async region => {
            //
            // });


            const totalReviewsByRegions = await Review.aggregate([
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
                    $sort: {
                        total: -1
                    }
                }, {
                    $project: {
                        _id: '$_id._id',
                        nameKz: '$_id.nameKz',
                        nameRu: "$_id.nameRu",
                        coordinates: "$_id.coordinates",
                        totalReviews: "$total"
                    }
                }
            ]);


            // const totalReviewsByRegions = await Nav.aggregate([
            //     {
            //         '$match': {
            //             'prevId': null
            //         }
            //     }, {
            //         '$lookup': {
            //             'from': 'navs',
            //             'localField': '_id',
            //             'foreignField': 'prevId',
            //             'as': 'Raions'
            //         }
            //     }, {
            //         '$unwind': {
            //             'path': '$Raions',
            //             'preserveNullAndEmptyArrays': false
            //         }
            //     }, {
            //         '$lookup': {
            //             'from': 'service-providers',
            //             'localField': 'Raions._id',
            //             'foreignField': 'navId',
            //             'as': 'ServiceProvider'
            //         }
            //     }, {
            //         '$unwind': {
            //             'path': '$ServiceProvider',
            //             'preserveNullAndEmptyArrays': false
            //         }
            //     }, {
            //         '$lookup': {
            //             'from': 'reviews',
            //             'localField': 'ServiceProvider._id',
            //             'foreignField': 'serviceProviderId',
            //             'as': 'Reviews'
            //         }
            //     }, {
            //         '$group': {
            //             '_id': '$_id',
            //             'nameKz': {
            //                 '$first': '$nameKz'
            //             },
            //             'nameRu': {
            //                 '$first': '$nameRu'
            //             },
            //             'coordinates': {
            //                 '$first': '$coordinates'
            //             },
            //             'totalReviews': {
            //                 '$sum': {
            //                     '$size': '$Reviews'
            //                 }
            //             }
            //         }
            //     }, {
            //         '$sort': {
            //             'totalReviews': -1
            //         }
            //     }, {
            //         '$limit': 5
            //     }
            // ]);

            return resolve(totalReviewsByRegions);

        } catch (err) {
            return reject(err);
        }

    });
};


const getAverageRating = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let avgRating = await Review.aggregate([
                {
                    $group: {
                        _id: null,
                        avgRate: {
                            $avg: '$rate'
                        }
                    }
                }
            ]);

            return resolve(avgRating[0].avgRate);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    getUsersCountByRole,
    getServiceProvidersCount,
    getOrganizationCount,
    getReviewsCount,
    getTotalServiceProvidersByRegions,
    getTotalReviewCountByRegions,
    getAverageRating
}