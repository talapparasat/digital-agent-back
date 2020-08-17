import Review from "../../models/Review";
import mongoose from "mongoose";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";

import ObjectId = mongoose.Types.ObjectId;

const getReviewsOfServiceProviderByStatus = async (serviceProviderId: ObjectId, status: number[] = [], page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.reviews;

            const reviews = await Review.aggregate([
                {
                    $match: {
                        serviceProviderId: new ObjectId(serviceProviderId),
                        status: {
                            $in: status
                        }
                    }
                },
                {
                    $sort: {
                        createdAt: -1
                    }
                },
                {
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
                },
                {
                    $lookup: {
                        from: "users",
                        let: {"operatorId": "$operatorId"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$_id', "$$operatorId"]
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
                        as: "Operator"
                    }
                },
                {
                    $unwind: {
                        path: "$Operator",
                        'preserveNullAndEmptyArrays': false
                    }
                },
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
                },

                {
                    $unwind: "$metadata"
                },
                {
                    $addFields: {
                        pageSize: limit
                    }
                },
                {
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

export = {
    getReviewsOfServiceProviderByStatus
}