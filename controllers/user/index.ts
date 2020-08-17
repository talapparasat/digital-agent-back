import 'ts-mongoose/plugin'
import mongoose from 'mongoose';

import User from '@db/User';
import Role from '@db/Role';
import UserRole from '@db/User-role';
import UserPosition from '@db/User-position'
import UserOrganization from '@db/User-organization';
import O_SP from '@db/Operator_Service-provider';
import S_SP from '@db/Supervisor_Service-provider';
import Organization from '@db/Organization';
import passwordGenerator from 'generate-password';
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import contactPerson from './contact-person'

const ObjectId = mongoose.Types.ObjectId;


import bus from '@modules/bus';

const getAll = async (role: string, query: string, page: number, organizationId: string = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(organizationId);
            const limit = NUMBER_OF_RESULTS_PER_PAGE.admin;

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
                                    name: role
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
                                    $or: [{name: new RegExp(query, "i")}, {email: new RegExp(query, "i")}]
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
                                                ...organizationId ? {organizationId: ObjectId(organizationId)} : {}
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: "organizations",
                                                localField: "organizationId",
                                                foreignField: "_id",
                                                as: "Organizations"
                                            }
                                        }
                                    ],
                                    as: "UserOrganization"
                                }
                            },
                            {
                                $unwind: {
                                    path: "$UserOrganization",
                                    "preserveNullAndEmptyArrays": true
                                }
                            },
                        ],
                        as: "Users"
                    }
                },
                {
                    $unwind: "$Users"
                },

                ...organizationId ? [
                    {
                        $match: {
                            'Users.UserOrganization': {$ne: null}
                        }
                    }
                ] : [],
                {
                    $project: {
                        "_id": 0,
                        "id": "$Users._id",
                        "name": "$Users.name",
                        "email": "$Users.email",
                        "phone": "$Users.phone",
                        "image": "$Users.image",
                        ...!organizationId ? {
                            "Organization": {
                                $cond:
                                    {
                                        if: "$Users.UserOrganization.Organizations",
                                        then: "$Users.UserOrganization.Organizations",
                                        else: []
                                    }
                            }
                        } : [],//"$Users.UserOrganization.Organizations",
                        "position": "$Users.UserOrganization.position"
                    }
                },
                {
                    '$facet': {
                        metadata: [
                            {$count: "total"},

                            {
                                $addFields:
                                    {
                                        // totalPages: {
                                        //     $ceil: {
                                        //         $divide: ["$total", limit]
                                        //     }
                                        // },
                                        total: "$total",
                                        currentPage: page
                                    }
                            }
                        ],

                        users: [
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
                        users: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }

            ]);

            return resolve(users[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByIdWithOrganization = async (userId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await UserOrganization.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(userId)
                    }
                }, {
                    '$lookup': {
                        'from': 'organizations',
                        'let': {
                            'organizationId': '$organizationId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$organizationId'
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    '__v': 0
                                }
                            }
                        ],
                        'as': 'Organization'
                    }
                }, {
                    '$unwind': {
                        'path': '$Organization'
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
                                    'hash': 0,
                                    'salt': 0,
                                    '__v': 0
                                }
                            }
                        ],
                        'as': 'User'
                    }
                }, {
                    '$unwind': {
                        'path': '$User'
                    }
                }, {
                    '$lookup': {
                        'from': 'user-positions',
                        'localField': 'userId',
                        'foreignField': 'userId',
                        'as': 'Position'
                    }
                }, {
                    '$unwind': {
                        'path': '$Position'
                    }
                }, {
                    '$addFields': {
                        'User.position': '$Position.position'
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'User': '$User',
                        'Organization': '$Organization'
                    }
                }
            ]);

            return resolve(users[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByIdWithOrganizationAndServiceProvider = async (userId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await UserOrganization.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(userId)
                    }
                }, {
                    '$lookup': {
                        'from': 'organizations',
                        'let': {
                            'organizationId': '$organizationId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$organizationId'
                                        ]
                                    }
                                }
                            }, {
                                '$project': {
                                    '__v': 0
                                }
                            }
                        ],
                        'as': 'Organization'
                    }
                }, {
                    '$unwind': {
                        'path': '$Organization',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'operator_service-providers',
                        'let': {
                            'userId': '$userId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$userId', '$$userId'
                                        ]
                                    }
                                }
                            }, {
                                '$lookup': {
                                    'from': 'service-providers',
                                    'localField': 'serviceProviderId',
                                    'foreignField': '_id',
                                    'as': 'ServiceProvider'
                                }
                            }, {
                                '$unwind': '$ServiceProvider'
                            }
                        ],
                        'as': 'O_SP'
                    }
                }, {
                    '$unwind': {
                        'path': '$O_SP',
                        'preserveNullAndEmptyArrays': true
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
                                    'hash': 0,
                                    'salt': 0,
                                    '__v': 0
                                }
                            }
                        ],
                        'as': 'User'
                    }
                }, {
                    '$unwind': {
                        'path': '$User'
                    }
                }, {
                    '$lookup': {
                        'from': 'user-positions',
                        'localField': 'userId',
                        'foreignField': 'userId',
                        'as': 'Position'
                    }
                }, {
                    '$unwind': {
                        'path': '$Position',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$addFields': {
                        'User.position': '$Position.position'
                    }
                }, {
                    '$project': {
                        '_id': 0,
                        'User': '$User',
                        'Organization': '$Organization',
                        'ServiceProvider': {
                            '$cond': {
                                'if': '$O_SP.ServiceProvider',
                                'then': '$O_SP.ServiceProvider',
                                'else': null
                            }
                        }
                    }
                }
            ]);

            return resolve(users[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getFree = async (role: string) => {

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
                                    name: role
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
                                    localField: "_id",
                                    foreignField: "userId",
                                    as: "UserOrganization"
                                }
                            },
                            {
                                $match: {
                                    UserOrganization: {$eq: []}
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


const getUsersFromOrganization = async (organizationId: string, role: string, autocomplete: boolean, query: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const users = await UserOrganization.aggregate([
                {
                    $match: {
                        organizationId: ObjectId(organizationId)
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
                                    name: new RegExp(query, "i"),
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
                            },
                            {
                                $lookup: {
                                    from: 'user-roles',
                                    let: {'userId': '$_id'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ["$userId", "$$userId"]
                                                },
                                            },
                                        },
                                        {
                                            $lookup: {
                                                from: 'roles',
                                                let: {"roleId": "$roleId"},
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ["$_id", "$$roleId"]
                                                            },
                                                            name: role
                                                        },
                                                    },
                                                    {
                                                        $project: {
                                                            "_id": 0
                                                        }
                                                    }
                                                ],
                                                as: "Roles",
                                            }
                                        },
                                        {
                                            $unwind: "$Roles"
                                        },
                                        {
                                            $project: {
                                                "_id": 0,
                                            }
                                        }
                                    ],
                                    as: "UserRoles"
                                }
                            },
                            {
                                $unwind: "$UserRoles"
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
                        // userId: 1,
                        // organizationId: 1
                    }
                },
                ...autocomplete ? [{$limit: 7}] : []

            ]);

            return resolve(users);

        } catch (err) {
            return reject(err);
        }

    });
};


const getOperatorsBySupervisor = async (query: string, page: number, supervisorId: string = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.admin;

            const users = await S_SP.aggregate([
                {
                    $match: {
                        userId: ObjectId(supervisorId)
                    }
                }, {
                    $lookup: {
                        from: 'operator_service-providers',
                        let: {
                            'serviceProviderId': '$serviceProviderId'
                        },
                        pipeline: [{
                            '$match': {
                                '$expr': {
                                    '$eq': [
                                        '$serviceProviderId', '$$serviceProviderId'
                                    ]
                                }
                            }
                        },
                            {
                                $lookup: {
                                    from: 'users',
                                    let: {
                                        'userId': '$userId'
                                    },
                                    pipeline: [{
                                        $match: {
                                            $expr: {
                                                $eq: [
                                                    '$_id', '$$userId'
                                                ]
                                            },
                                            name: new RegExp(query, "i"),
                                        }
                                    }],
                                    as: 'User'
                                }
                            },
                            {
                                $unwind: '$User'
                            }
                        ],
                        as: 'OSP'
                    }
                }, {
                    $lookup: {
                        from: 'service-providers',
                        localField: 'serviceProviderId',
                        foreignField: '_id',
                        as: 'ServiceProvider'
                    }
                }, {
                    $unwind: {
                        path: '$ServiceProvider',
                        preserveNullAndEmptyArrays: true
                    }
                }, {
                    $unwind: {
                        path: '$OSP',
                        preserveNullAndEmptyArrays: true
                    }
                }, {
                    $project: {
                        "_id": 0,
                        "id": "$OSP.User._id",
                        "name": "$OSP.User.name",
                        "email": "$OSP.User.email",
                        "phone": "$OSP.User.phone",
                        "image": "$OSP.User.image",
                        "ServiceProvider": "$ServiceProvider"
                    }
                },
                {
                    '$facet': {
                        metadata: [
                            {$count: "total"},

                            {
                                $addFields:
                                    {
                                        // totalPages: {
                                        //     $ceil: {
                                        //         $divide: ["$total", limit]
                                        //     }
                                        // },
                                        total: "$total",
                                        currentPage: page
                                    }
                            }
                        ],

                        users: [
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
                        users: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(users[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getById = async (userId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let user: any = User.aggregate([
                {
                    $match: {
                        _id: ObjectId(userId)
                    }
                },
                {
                    $lookup: {
                        from: 'user-positions',
                        localField: '_id',
                        foreignField: 'userId',
                        as: "Position"
                    }
                },
                {
                    $unwind: "$Position"
                },
                {
                    $addFields: {
                        'position': "$Position.position"
                    }
                },
                {
                    $project: {
                        'Position': 0,
                        hash: 0,
                        salt: 0,
                        suspended: 0,
                        __v: 0,
                        register_date: 0
                    }
                }
            ]);

            return resolve(user);

        } catch (err) {
            return reject(err);
        }

    });
};

const createUserForOrganization = async (organizationId: string,
                                         {name, email, phone, image}: any,
                                         role: string, position: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const newUser = new User({
                name,
                email,
                phone,
                image
            });

            // const password = passwordGenerator.generate({
            //     length: 10,
            //     numbers: true
            // });

            const password = '123456789';

            console.log({password});

            newUser.setPassword(password);

            await newUser.save({session});

            const {_id: userId} = newUser;

            const {_id: roleId} = await Role.findOne({
                name: role
            }, {}, {session});

            await new UserRole({
                userId,
                roleId
            }).save({session});

            await new UserPosition({
                userId,
                position
            }).save({session});

            await new UserOrganization({
                organizationId,
                userId,
            }).save({session});

            await session.commitTransaction();
            session.endSession();

            bus.emit('event.organisations.users.created', {
                _id: newUser._id,
                password,
                role
            });

            return resolve(newUser);

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const update = async (userId: string,
                      {name, email, phone, image}: any,
                      position: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            console.log('inside controller');

            const updatedUser = await User.findByIdAndUpdate(userId, {
                name,
                email,
                phone,
                image
            }, {new: true}).session(session);

            const updatedUserPosition = await UserPosition.updateOne({
                    userId
                }, {
                    $set: {
                        position
                    }
                }, {session}
            );

            await session.commitTransaction();
            session.endSession();

            console.log({updatedUser, updatedUserPosition});

            return resolve({updatedUser, updatedUserPosition});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const createUser = async ({name, email, phone, image}: any, role: string, position: string, session:any = null) => {

    return new Promise(async (resolve, reject) => {

        if(!session) {
            session = await mongoose.startSession();
            session.startTransaction();
        }

        try {

            const newUser = new User({
                name,
                email,
                phone,
                image
            });

            // const password = passwordGenerator.generate({
            //     length: 10,
            //     numbers: true
            // });

            const password = "123456789";

            console.log({password});

            newUser.setPassword(password);

            await newUser.save({session});

            const {_id: userId} = newUser;

            const {_id: roleId} = await Role.findOne({
                name: role
            }, {}, {session});

            await new UserRole({
                userId,
                roleId
            }).save({session});

            await new UserPosition({
                userId,
                position
            }).save({session});

            await session.commitTransaction();
            session.endSession();

            bus.emit('event.organisations.users.created', {
                _id: userId,
                password,
                role,
                email
            });

            return resolve(newUser);

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};

const createUser1 = async ({name, email, phone, image, password}: any, role: string, position: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const superAdmin = await new Role({
                name: "superadmin"
            }).save();

            const admin = await new Role({
                name: "admin"
            }).save();

            const newUser = new User({
                name,
                email,
                phone,
                image
            });

            const password = "123456789";

            newUser.setPassword(password);

            await newUser.save();

            const {_id: userId} = newUser;

            const {_id: roleId} = await Role.findOne({
                name: role
            }, {},);

            await new UserRole({
                userId,
                roleId: superAdmin._id
            }).save();

            await new UserPosition({
                userId,
                position
            }).save();

            return resolve(newUser);

        } catch (err) {
            return reject(err);
        }

    });

};

const addToOrganization = async (userId: string, organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const options = {upsert: true, new: true, setDefaultsOnInsert: true};

            const userOrganization = await UserOrganization.findOneAndUpdate({
                userId
            }, {
                organizationId
            }, options);

            return resolve(userOrganization)

        } catch (err) {

            return reject(err);

        }

    });

};

const addArrayToOrganization = async (organizationId: string, users: [string]) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log(users);

            let existingUserOrganizations = await UserOrganization.find({
                organizationId,
                suspended: false
            }, '-_id userId', {session});

            let existingUserOrganizationsArr = existingUserOrganizations.map((user) => {
                console.log(user);
                return user.userId.toString();
            });


            let userOrganizationsToSuspend = existingUserOrganizationsArr.map(item => {
                if (!users.includes(item)) {
                    return item;
                }
            });

            console.log(userOrganizationsToSuspend);


            let suspendedUserOrganizations = await UserOrganization.deleteMany({
                userId: {$in: [...userOrganizationsToSuspend]}
            }).session(session);


            let userOrganizationsToCreate = users.filter(userId => !existingUserOrganizationsArr.includes(userId));

            let userArray = userOrganizationsToCreate.map(userId => {
                return {userId, organizationId}
            });

            console.log(userArray);
            let newUserOrganizations = await UserOrganization.insertMany(userArray, {session});

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedUserOrganizations, newUserOrganizations});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);

        }

    });

};


const addUsersArrayToServiceProvider = async (serviceProviderId: string, users: [string]) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log({users});

            let existingUserOrganizations = await O_SP.find({
                serviceProviderId,
            }, '-_id userId', {session});

            let existingUserOrganizationsArr = existingUserOrganizations.map((user) => {
                console.log(user);
                return user.userId.toString();
            });

            console.log({existingUserOrganizationsArr});


            let userOrganizationsToSuspend = existingUserOrganizationsArr.filter(item => {
                console.log({item});
                console.log(!users.includes(item));
                return !users.includes(item);
            });

            console.log({userOrganizationsToSuspend});


            let suspendedUserOrganizations = await O_SP.deleteMany({
                userId: {$in: [...userOrganizationsToSuspend]}
            }).session(session);


            let userOrganizationsToCreate = users.filter(userId => !existingUserOrganizationsArr.includes(userId));

            let userArray = userOrganizationsToCreate.map(userId => {
                return {userId, serviceProviderId}
            });

            console.log({userArray});
            let newUserOrganizations = await O_SP.insertMany(userArray, {session});

            await session.commitTransaction();
            session.endSession();

            return resolve({
                suspendedServiceProviderUsers: suspendedUserOrganizations,
                newServiceProviderUsers: newUserOrganizations
            });

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);

        }

    });

};


const connectOperatorToOrganizationAndServiceProvider = async (organizationId: string, serviceProviderId: string, userId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        console.log(organizationId, serviceProviderId, userId);

        try {

            let organizationOperator = await UserOrganization.findOneAndUpdate({
                userId
            }, {
                organizationId
            }, {new: true, upsert: true}).session(session);

            let serviceProviderOperator = await O_SP.findOneAndUpdate({
                userId
            }, {
                serviceProviderId
            }, {new: true, upsert: true}).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({organizationOperator, serviceProviderOperator});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);

        }

    });

};


const checkSuspend = async (userId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let serviceProvidersCount = await S_SP.find({
                userId
            }).countDocuments();

            if (serviceProvidersCount > 0) {

                return resolve({suspended: false, serviceProvidersCount})

            } else {

                let result = await suspend(userId);

                return resolve(result)

            }

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


const suspendConfirmed = async (userId: string, to: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let updated_s_sps = await S_SP.updateMany({
                userId
            }, {
                $set: {
                    to
                }
            });

            let result: any = await suspend(userId);

            return resolve({...result, updated_s_sps})

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


const suspend = async (userId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            const suspendedUser = await User.findByIdAndUpdate(userId, {
                    suspended: true
                }, {new: true}
            ).session(session);

            const deletedUserPosition = await UserPosition.deleteOne({
                userId
            }).session(session);

            const deletedUserRole = await UserRole.deleteOne({
                userId
            }).session(session);

            const deletedUserOrganization = await UserOrganization.deleteOne({
                userId
            }).session(session);

            const deletedOperatorServiceProvider = await O_SP.deleteOne({
                userId
            }).session(session);

            const deletedSupervisorServiceProvider = await S_SP.deleteOne({
                userId
            }).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({
                suspendedUser,
                deletedUserPosition,
                deletedUserRole,
                deletedUserOrganization,
                deletedOperatorServiceProvider,
                deletedSupervisorServiceProvider
            });

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


const suspendRelation = async (userId: string, organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const suspendedUserOrganization = await UserOrganization.updateOne({
                userId,
                organizationId
            }, {
                $set: {
                    suspended: true
                }
            });

            return resolve({suspendedUserOrganization});

        } catch (err) {
            return reject(err);
        }

    });

};


// const suspendRelation = async (userId: string) => {
//
//     return new Promise(async (resolve, reject) => {
//
//         try {
//
//             const user = await User.findOne({
//                 _id: userId
//             });
//
//             const {suspended, phone}: any = user;
//
//             let newUserData: any;
//
//             if (suspended) {
//
//                 newUserData = {
//                     phone: suspended.phone,
//                     suspended: null
//                 };
//
//             } else {
//
//                 newUserData = {
//                     suspended: {
//                         phone
//                     },
//                     phone: 'suspended:' + new Date().getTime()
//                 };
//
//             }
//
//             const result = await User.updateOne({
//                 _id: userId
//             }, {
//                 $set: newUserData
//             });
//
//             return resolve(result);
//
//         } catch (err) {
//             return reject(err);
//         }
//
//     });
//
// };


const getUserRole = async (userId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userRole = await UserRole.findOne({
                    userId,
                },
                'roleId'
            ).populate({path: 'roleId', select: 'name -_id'});

            console.log(userRole);

            if (userRole)
                return resolve(userRole.roleId);
            return resolve({name: 'user'})
        } catch (err) {
            return reject(err)
        }
    })
};


const normalizeRelations = async (userId: string) => {
    return new Promise(async (resolve, reject) => {
        try {
            const userRole = await UserRole.findOne({
                    userId,
                },
                'roleId'
            ).populate({path: 'roleId', select: 'name -_id'});

            console.log(userRole);

            if (userRole)
                return resolve(userRole.roleId);
            return resolve({name: 'user'})
        } catch (err) {
            return reject(err)
        }
    })
};


export = {
    update,
    checkSuspend,
    suspendConfirmed,
    suspend,
    suspendRelation,
    getAll,
    getUsersFromOrganization,
    getOperatorsBySupervisor,
    getById,
    createUserForOrganization,
    connectOperatorToOrganizationAndServiceProvider,
    createUser,
    addToOrganization,
    addArrayToOrganization,
    addUsersArrayToServiceProvider,
    getUserRole,
    getFree,
    getByIdWithOrganization,
    getByIdWithOrganizationAndServiceProvider,
    createUser1,
    ...contactPerson
};

