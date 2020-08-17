import O_SP from "@db/Operator_Service-provider";
import mongoose from "mongoose";
import ObjectId = mongoose.Types.ObjectId;

const getContactPersonsOfServiceProvider = async (serviceProviderId: ObjectId) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await O_SP.aggregate([
                {
                    $match: {
                        serviceProviderId
                    }
                },
                {
                    $lookup: {
                        from: 'users',
                        let: {'userId': '$userId'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', '$$userId']
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
                        as: 'User'
                    }
                },
                {
                    $unwind: {
                        path: "$User",
                        "preserveNullAndEmptyArrays": false
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: '$User'
                    }
                }
            ]);

            return resolve(users);

        } catch (err) {
            return reject(err);
        }

    });

};

export = {
    getContactPersonsOfServiceProvider
}