import Nav from "@db/Nav";
import ReviewHistory from "@db/ReviewHistory";
import Review from "@db/Review";
import mongoose from "mongoose";
import ObjectId = mongoose.Types.ObjectId;
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";

const getContactPersonHistory = async (contactPersonId: ObjectId, page: number = 1) => {

    return new Promise(async (resolve, reject) => {

        try {

            let limit = NUMBER_OF_RESULTS_PER_PAGE.history;

            let history = await Review.aggregate([
                {
                    '$match': {
                        'operatorId': contactPersonId
                    }
                }, {
                    '$lookup': {
                        'from': 'review-histories',
                        'let': {
                            'reviewId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$reviewId', '$$reviewId'
                                        ]
                                    }
                                }
                            }
                        ],
                        'as': 'History'
                    }
                }, {
                    '$unwind': {
                        'path': '$History',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$lookup': {
                        'from': 'users',
                        'let': {
                            'userId': '$userId'
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
                                    'email': 1
                                }
                            }
                        ],
                        'as': 'User'
                    }
                }, {
                    '$unwind': {
                        'path': '$User',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'History.User': '$User'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$History'
                    }
                }, {
                    '$sort': {
                        'createdAt': -1
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

                        history: [
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
                        history: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);


            return resolve(history[0]);

        } catch (err) {
            return reject(err);
        }

    });
};

export = {
    getContactPersonHistory
}