import mongoose, {Types} from "mongoose"
import UserRole from "@db/User-role";
import User from "@db/User";
import Operator_ServiceProvider from "@db/Operator_Service-provider"
import Review, {STATUSES} from "@db/Review";
const ObjectId = mongoose.Types.ObjectId;

const getUsersCountByRole = async (serviceProvider: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            const contactPersonsCount = await getContactPersonsCount(serviceProvider);
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


const getContactPersonsCount = async (serviceProvider: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            if(!serviceProvider) {
                return resolve(0);
            }

            const result = await Operator_ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderId': new ObjectId(serviceProvider._id)
                    }
                }, {
                    '$count': 'total'
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


const getReviewsCount = async (serviceProvider: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            if(!serviceProvider) {
                return resolve({
                    all: 0,
                    resolved: 0,
                    inProcess: 0
                });
            }

            const reviewsCount = await Review.aggregate([
                {
                    '$match': {
                        'serviceProviderId': new ObjectId(serviceProvider._id)
                    }
                }, {
                    '$group': {
                        '_id': '$status',
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


const getAverageRating = async (serviceProvider: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            if (!serviceProvider) {
                return resolve(0)
            }

            return resolve(serviceProvider.rate);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    getUsersCountByRole,
    getReviewsCount,
    getAverageRating
}