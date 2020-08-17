import ServiceProvider, {ServiceProviderProps} from '@db/Service-provider';
import OSP from '@db/Organization_Service-provider';
import O_SP from '@db/Operator_Service-provider';
import S_SP from '@db/Supervisor_Service-provider';
import Nav from '@db/Nav';
import mongoose from 'mongoose';
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import ServiceName from "@db/Service-name";
import statistics from './statistics'

const ObjectId = mongoose.Types.ObjectId;


const get = async (query: string = '', page: number = 1) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceProvider;

            console.log(query);

            let serviceProviders = await ServiceProvider.aggregate([
                {
                    $match: {
                        suspended: false,
                        nameRu: new RegExp(query, "i"),
                    }
                },
                {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'navId',
                        'foreignField': '_id',
                        'as': 'raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$raion'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'raion.prevId',
                        'foreignField': '_id',
                        'as': 'region'
                    }
                }, {
                    '$unwind': {
                        'path': '$region'
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

                        serviceProviders: [
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
                        serviceProviders: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            console.log(serviceProviders[0]);

            return resolve(serviceProviders[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const getForSupervisor = async (supervisorId: string, query: string = '', page: number = 1) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceProvider;

            console.log(query);

            let serviceProviders = await S_SP.aggregate([
                {
                    $match: {
                        userId: ObjectId(supervisorId)
                    }
                },
                {
                    $lookup: {
                        from: 'service-providers',
                        localField: 'serviceProviderId',
                        foreignField: '_id',
                        as: 'ServiceProvider'
                    }
                },
                {
                    $unwind: '$ServiceProvider'
                },
                {
                    $replaceRoot: {
                        newRoot: '$ServiceProvider'
                    }
                },
                {
                    $match: {
                        suspended: false,
                        nameRu: new RegExp(query, "i"),
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'navId',
                        'foreignField': '_id',
                        'as': 'raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$raion'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'raion.prevId',
                        'foreignField': '_id',
                        'as': 'region'
                    }
                }, {
                    '$unwind': {
                        'path': '$region'
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

                        serviceProviders: [
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
                        serviceProviders: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            console.log(serviceProviders[0]);

            return resolve(serviceProviders[0]);

        } catch (err) {
            return reject(err);
        }

    });
};


const autocomplete = async (query: string, organizationId: string = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log([...organizationId ? [{organizationId: ObjectId(organizationId)}] : []]);


            let serviceProviders = await OSP.aggregate([
                {
                    $match: {
                        ...organizationId ? {organizationId: ObjectId(organizationId)} : {}
                    }
                },
                {
                    $lookup: {
                        from: "service-providers",
                        let: {"serviceProviderId": "$serviceProviderId"},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ["$_id", "$$serviceProviderId"]
                                    },
                                    nameRu: new RegExp(query, "i"),
                                }
                            }
                        ],
                        as: "ServiceProvider"
                    }
                },
                {
                    $unwind: "$ServiceProvider"
                },
                {
                    $project: {
                        _id: '$ServiceProvider._id',
                        nameKz: '$ServiceProvider.nameKz',
                        nameRu: '$ServiceProvider.nameRu',
                        info: '$ServiceProvider.info',
                        address: '$ServiceProvider.address',
                        serviceProviderTypeId: '$ServiceProvider.serviceProviderTypeId',
                        image: '$ServiceProvider.image',
                    }
                },
                {
                    $limit: 5
                }
            ]);


            return resolve(serviceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByServiceProviderTypeId = async (page: number, query: string, lang: string, serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceProvider;

            const count = await await ServiceProvider.countDocuments(
                {
                    serviceProviderTypeId,
                    $or: [
                        {
                            nameRu: RegExp(query, 'i')
                        },
                        {
                            nameKz: RegExp(query, 'i')
                        },
                        {
                            address: RegExp(query, 'i')
                        }
                    ],
                    // ...lang=='ru'?{nameRu: new RegExp(query, "i")}:{nameKz: new RegExp(query, "i")},
                    approved: true,
                    suspended: false
                }
            );

            let skip = Math.ceil((page - 1) * limit);

            let serviceProviders = await ServiceProvider.find(
                {
                    serviceProviderTypeId,
                    $or: [
                        {
                            nameRu: RegExp(query, 'i')
                        },
                        {
                            nameKz: RegExp(query, 'i')
                        },
                        {
                            address: RegExp(query, 'i')
                        }
                    ],
                    approved: true,
                    suspended: false
                },
                'nameKz nameRu address image rate'
            )
                .sort(lang == 'ru' ? {nameRu: 1} : {nameKz: 1})
                .skip(skip)
                .limit(limit);

            return resolve({serviceProviders, currentPage: page, totalPages: Math.ceil(count / limit)});

        } catch (err) {
            return reject(err);
        }

    });
};


const getByPrevIdAndOSPT = async (navId: string, serviceProviderTypeId: string, organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {


            let serviceProviders = await ServiceProvider.aggregate([
                {
                    '$match': {
                        navId: navId ? ObjectId(navId) : null,
                        'serviceProviderTypeId': new ObjectId(serviceProviderTypeId),
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-providers',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'OSP'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSP',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$match': {
                        ...organizationId ? {'OSP.organizationId': new ObjectId(organizationId)} : {}
                    }
                }, {
                    '$lookup': {
                        'from': 'operator_service-providers',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'O_SP'
                    }
                }, {
                    '$match': {
                        'O_SP': {
                            $ne: []
                        }
                    }
                }, {
                    $project: {
                        nameRu: 1,
                        nameKz: 1,
                        image: 1,
                        address: 1,
                        rate: 1
                    }
                }
            ]);

            return resolve(serviceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


//For mobile
const getByIdWithAdditionalInfo = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProvider = await OSP.aggregate([
                {
                    '$match': {
                        'serviceProviderId': new ObjectId(serviceProviderId),
                        'suspended': false
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
                        'path': '$ServiceProvider'
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-provider-types',
                        'let': {
                            'organizationId': '$organizationId',
                            'serviceProviderTypeId': '$ServiceProvider.serviceProviderTypeId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$and': [
                                            {
                                                '$eq': [
                                                    '$organizationId', '$$organizationId'
                                                ]
                                            }, {
                                                '$eq': [
                                                    '$serviceProviderTypeId', '$$serviceProviderTypeId'
                                                ]
                                            }
                                        ]
                                    },
                                    'suspended': false
                                }
                            }
                        ],
                        'as': 'OSPT'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSPT'
                    }
                }, {
                    '$lookup': {
                        'from': 'ospt_fields',
                        'let': {
                            'osptId': '$OSPT._id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$osptId', '$$osptId'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$lookup': {
                                    'from': 'fields',
                                    'localField': 'fieldId',
                                    'foreignField': '_id',
                                    'as': 'Field'
                                }
                            }, {
                                '$unwind': '$Field'
                            }, {
                                '$replaceRoot': {
                                    'newRoot': '$Field'
                                }
                            }
                        ],
                        'as': 'Fields'
                    }
                }, {
                    '$lookup': {
                        'from': 'o_spt_servicenames',
                        'let': {
                            'osptId': '$OSPT._id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$osptId', '$$osptId'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$lookup': {
                                    'from': 'service-names',
                                    'let': {
                                        'serviceNameId': '$serviceNameId'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                '$expr': {
                                                    '$eq': [
                                                        '$_id', '$$serviceNameId'
                                                    ]
                                                },
                                                'suspended': false
                                            }
                                        }, {
                                            '$project': {
                                                '__v': 0,
                                                'suspended': 0
                                            }
                                        }
                                    ],
                                    'as': 'ServiceName'
                                }
                            }, {
                                '$unwind': '$ServiceName'
                            }, {
                                '$replaceRoot': {
                                    'newRoot': '$ServiceName'
                                }
                            }
                        ],
                        'as': 'ServiceNames'
                    }
                }, {
                    '$lookup': {
                        'from': 'ospt_service-categories',
                        'let': {
                            'osptId': '$OSPT._id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$osptId', '$$osptId'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$lookup': {
                                    'from': 'service-categories',
                                    'let': {
                                        'serviceCategoryId': '$serviceCategoryId'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                '$expr': {
                                                    '$eq': [
                                                        '$_id', '$$serviceCategoryId'
                                                    ]
                                                },
                                                'suspended': false
                                            }
                                        }, {
                                            '$project': {
                                                '__v': 0,
                                                'suspended': 0,
                                                'attachmentId': 0
                                            }
                                        }
                                    ],
                                    'as': 'ServiceCategory'
                                }
                            }, {
                                '$unwind': '$ServiceCategory'
                            }, {
                                '$lookup': {
                                    'from': 'ospt_sc_scs',
                                    'let': {
                                        'ospt_scId': '$_id'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                '$expr': {
                                                    '$eq': [
                                                        '$osptServiceCategoryId', '$$ospt_scId'
                                                    ]
                                                },
                                                'suspended': false
                                            }
                                        }, {
                                            '$lookup': {
                                                'from': 'service-criterias',
                                                'let': {
                                                    'serviceCriteriaId': '$serviceCriteriaId'
                                                },
                                                'pipeline': [
                                                    {
                                                        '$match': {
                                                            '$expr': {
                                                                '$eq': [
                                                                    '$_id', '$$serviceCriteriaId'
                                                                ]
                                                            },
                                                            'suspended': false
                                                        }
                                                    }, {
                                                        '$project': {
                                                            '__v': 0,
                                                            'suspended': 0
                                                        }
                                                    }
                                                ],
                                                'as': 'ServiceCriteria'
                                            }
                                        }, {
                                            '$unwind': '$ServiceCriteria'
                                        }, {
                                            '$replaceRoot': {
                                                'newRoot': '$ServiceCriteria'
                                            }
                                        }
                                    ],
                                    'as': 'criterias'
                                }
                            }, {
                                '$addFields': {
                                    'ServiceCategory.criterias': '$criterias'
                                }
                            }, {
                                '$replaceRoot': {
                                    'newRoot': '$ServiceCategory'
                                }
                            }
                        ],
                        'as': 'categories'
                    }
                }, {
                    '$addFields': {
                        'ServiceProvider.categories': '$categories',
                        'ServiceProvider.services': '$ServiceNames',
                        'ServiceProvider.fields': '$Fields'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$ServiceProvider'
                    }
                }, {
                    '$project': {
                        '__v': 0,
                        'suspended': 0,
                        'info': 0,
                        'approved': 0
                    }
                }
            ]);

            return resolve(serviceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const getById = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProvider = await ServiceProvider.findOne({_id: serviceProviderId, suspended: false});

            return resolve(serviceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const getCountByServiceProviderType = async (serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const count = await ServiceProvider.find({
                serviceProviderTypeId,
                suspended: false
            }).countDocuments();

            return resolve(count);

        } catch (err) {
            return reject(err);
        }

    });

};

const create = async ({nameKz, nameRu, info, address, image, coordinates, workHours}: ServiceProviderProps, approved: boolean = false) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceProvider = new ServiceProvider({
                nameKz,
                nameRu,
                info,
                address,
                image,
                approved,
                coordinates,
                workHours
            });

            newServiceProvider = await newServiceProvider.save();

            return resolve(newServiceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const update = async (serviceProviderId: string, {nameKz, nameRu, info, address, serviceProviderTypeId, image, coordinates, workHours}: ServiceProviderProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updatedServiceProvider = await ServiceProvider.findByIdAndUpdate(serviceProviderId, {
                nameKz,
                nameRu,
                info,
                address,
                ...serviceProviderTypeId ? {serviceProviderTypeId} : [],
                image,
                coordinates,
                workHours
            }, {new: true});

            return resolve(updatedServiceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const connectToOrganization = async (organizationId: string, serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOrganizationServiceProvider = await OSP.create({
                organizationId,
                serviceProviderId
            });

            return resolve(newOrganizationServiceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const connectContactPerson = async (serviceProviderId: string, userId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceProviderUser = await O_SP.findOneAndUpdate({
                userId,
            }, {
                serviceProviderId
            }, {new: true});

            return resolve(newServiceProviderUser);

        } catch (err) {
            return reject(err);
        }

    });
};


const connectToSupervisor = async (serviceProviderId: string, userId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceProviderUser = S_SP.findOneAndUpdate({
                userId
            }, {
                serviceProviderId
            }, {new: true});

            return resolve(newServiceProviderUser);

        } catch (err) {
            return reject(err);
        }

    });
};


const connectToOrganizationAndSupervisorAndNav = async (organizationId: string, supervisorId: string, serviceProviderTypeId: string, serviceProviderId: string, navId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let newOrganizationServiceProvider = await OSP.findOneAndUpdate({
                serviceProviderId
            }, {
                organizationId
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }).session(session);

            let newServiceProviderUser = await S_SP.findOneAndUpdate({
                serviceProviderId
            }, {
                userId: supervisorId
            }, {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true
            }).session(session);

            let updatedServiceProvider = await ServiceProvider.findByIdAndUpdate(serviceProviderId, {
                serviceProviderTypeId,
                navId
            }, {
                new: true
            }).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({newOrganizationServiceProvider, newServiceProviderUser, updatedServiceProvider});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const approve = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let approvedServiceProvider = await ServiceProvider.findByIdAndUpdate(serviceProviderId, {
                approved: true
            }, {new: true});

            return resolve(approvedServiceProvider);

        } catch (err) {
            return reject(err);
        }

    });
};


const confirm = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProvider = await ServiceProvider.findById(serviceProviderId);

            let nav1 = await Nav.findById(serviceProvider.navId);

            let nav2: any;

            if (nav1) {
                nav2 = await Nav.findById(nav1.prevId)
            }

            if (nav2) {
                let temp = nav1;
                nav1 = nav2;
                nav2 = temp;
            }

            let organization = await OSP.findOne({
                serviceProviderId
            }).populateTs('organizationId');

            organization = organization ? organization.organizationId : null;

            let supervisor = await S_SP.findOne({
                serviceProviderId
            }).populateTs('userId');

            supervisor = supervisor ? supervisor.userId : null;

            let operators = await O_SP.find({
                serviceProviderId
            }).populateTs('userId');

            operators = operators.map(item => {
                return item.userId
            });

            return resolve({serviceProvider, organization, supervisor, operators, region: nav1, raion: nav2});

        } catch (err) {
            return reject(err.message);
        }

    });
};


const search = async (serviceProviderTypeId: string, query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(serviceProviderTypeId);

            let serviceProviders = ServiceProvider.find({
                serviceProviderTypeId,
                $or: [
                    {nameKz: new RegExp(query, "i")},
                    {nameRu: new RegExp(query, "i")},
                    {address: new RegExp(query, "i")},
                ],
                suspended: false,
                approved: true
            });

            return resolve(serviceProviders);

        } catch (err) {
            return reject(err.message);
        }

    });
};


const suspend = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let suspendedServiceProvider = await ServiceProvider.findByIdAndUpdate(serviceProviderId,
                {
                    suspended: true
                }, {new: true});

            const deletedOperatorServiceProvider = await O_SP.deleteOne({
                serviceProviderId
            }).session(session);

            const deletedSupervisorServiceProvider = await S_SP.deleteOne({
                serviceProviderId
            }).session(session);

            const deletedServiceProviderOrganization = await OSP.deleteOne({
                serviceProviderId
            }).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({
                suspendedServiceProvider,
                deletedOperatorServiceProvider,
                deletedSupervisorServiceProvider,
                deletedServiceProviderOrganization
            });

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err.message);
        }

    });
};


const getOrganization = async (serviceProviderId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const organization = await OSP.findOne({
                serviceProviderId
            });

            return resolve(organization ? organization.organizationId : null);

        } catch (err) {
            return reject(err);
        }

    });

};


export = {
    get,
    getForSupervisor,
    autocomplete,
    getById,
    getByIdWithAdditionalInfo,
    getByServiceProviderTypeId,
    getByPrevIdAndOSPT,
    getCountByServiceProviderType,
    create,
    update,
    connectToOrganization,
    connectToSupervisor,
    connectContactPerson,
    connectToOrganizationAndSupervisorAndNav,
    approve,
    confirm,
    search,
    suspend,
    getOrganization,
    ...statistics
}


// {
//     $lookup: {
//         from: 'ospt_fields',
//             let: {
//             ospt
//         },
//         localField: '$OSPT._id',
//             foreignField: 'osptId',
//             as: 'OSPT_Fields'
//     }
// },