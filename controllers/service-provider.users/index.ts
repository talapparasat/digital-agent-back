import UserOrganization from "@db/User-organization";
import O_SP from "@db/Operator_Service-provider";
import mongoose from "mongoose";
import UserRole from "@db/User-role";
import {ROLES} from "@db/Role";
const ObjectId = mongoose.Types.ObjectId;


const getUsersFromServiceProvider = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await O_SP.aggregate([
                {
                    $match: {
                        serviceProviderId: ObjectId(serviceProviderId)
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
                                        $eq: ["$_id", "$$userId"]
                                    },
                                    suspended: false
                                },
                            },
                            {
                                $lookup: {
                                    from: 'user-positions',
                                    localField: "_id",
                                    foreignField: "userId",
                                    as: "Positions"
                                }
                            },
                            {
                                $unwind: "$Positions"
                            }
                        ],
                        as: 'Users'
                    }
                },
                {
                    $unwind: "$Users"
                },
                {
                    $match: {
                        Users: {$ne: []}
                    }
                },
                {
                    $project: {
                        "_id": "$Users._id",
                        "name": "$Users.name",
                        "email": "$Users.email",
                        "phone": "$Users.phone",
                        "image": "$Users.image",
                        "role": "$UserRoles.Roles.name",
                        "position": "$Users.Positions.position"
                    }
                },

            ]);

            return resolve(users);

        } catch (err) {
            return reject(err);
        }

    });
};


const getFreeOperators = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await UserRole.aggregate([
                {
                    $lookup: {
                        from: "roles",
                        let: {"roleId": "$roleId"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$roleId"]
                                    },
                                    name: ROLES.OPERATOR
                                }
                            }
                        ],
                        as: "Role"
                    }
                },
                {
                    $unwind: "$Role"
                },
                {
                    $lookup: {
                        from: "users",
                        let: {"userId": "$userId"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$userId"]
                                    },
                                },
                            },
                            {
                                $lookup: {
                                    from: "user-organizations",
                                    let: {"userId": "$_id"},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$userId", "$$userId"]
                                                },
                                                organizationId: ObjectId(organizationId)
                                            },
                                        }
                                    ],
                                    as: "UserOrganization"
                                }
                            },
                            {
                                $match: {
                                    UserOrganization: {$ne: []}
                                }
                            },

                            {
                                $lookup: {
                                    from: "operator_service-providers",
                                    localField: "_id",
                                    foreignField: "userId",
                                    as: "UserServiceProvider"
                                }
                            },
                            {
                                $match: {
                                    UserServiceProvider: {$eq: []}
                                }
                            },
                        ],
                        as: "Users"
                    }
                },
                {
                    $unwind: "$Users"
                },
                {
                    $project: {
                        "_id": 0,
                        "id": "$Users._id",
                        "name": "$Users.name",
                        "email": "$Users.email",
                        "phone": "$Users.phone",
                        "image": "$Users.image",
                    }
                },

            ]);

            return resolve(users);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    getUsersFromServiceProvider,
    getFreeOperators
}