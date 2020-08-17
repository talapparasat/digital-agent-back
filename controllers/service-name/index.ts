import ServiceName, {ServiceNameProps} from '@db/Service-name';
import ServiceProvider from '@db/Service-provider';
import Operator_ServiceProvider from '@db/Operator_Service-provider';
import Supervisor_ServiceProvider from '@db/Supervisor_Service-provider';
import OSPT, {OrganizationServiceProviderTypeProps} from '@db/Organization_Service-provider-type';
import OSPT_SN, {OSPTServiceNameProps} from '@db/OSPT_Service-name';
import mongoose from "mongoose";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import ServiceProviderType from "@db/Service-provider-type";
import {ServiceCategoryProps} from "@db/Service-category";
import ServiceCriteria from "@db/Service-criteria";

const ObjectId = mongoose.Types.ObjectId;


const get = async (findRequestData: any) => {

    return new Promise(async (resolve, reject) => {

        // try {
        //
        //     let organizationsServiceProviderTypes = await OrganizationServiceProviderType.find({...findRequestData});
        //
        //     return resolve(organizationsServiceProviderTypes);
        //
        // } catch (err) {
        //     return reject(err);
        // }

    });
};

const getByServiceProviderType = async (serviceProviderTypeId: string, query: string, lang: string) => {
    return new Promise(async (resolve, reject) => {

        try {

            let regex = {};
            if (lang == 'kz') {
                regex = {nameKz: new RegExp(query, "i")}
            } else {
                regex = {nameRu: new RegExp(query, "i")}
            }

            let serviceNames = await ServiceName.aggregate([
                {
                    $match: {
                        ...regex,
                        suspended: false
                    }
                },
                {
                    $lookup: {
                        from: "o_spt_servicenames",
                        let: { "serviceNameId": "$_id" },
                        pipeline: [
                            {
                                $match:
                                    {
                                        $expr: {
                                            $eq: [ "$serviceNameId", "$$serviceNameId" ]
                                        },
                                    }
                            },
                            {
                                $lookup: {
                                    from: "organization_service-provider-types",
                                    let: { "osptId": "$osptId" },
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr: {
                                                        $eq: [ "$_id", "$$osptId" ]
                                                    },
                                                    serviceProviderTypeId: ObjectId(serviceProviderTypeId),
                                                    suspended: false
                                                }
                                        }
                                    ],
                                    as: "OSPT"
                                },
                            },
                            {
                                $match: {
                                    OSPT: {$ne: []}
                                }
                            }
                        ],
                        as: "ServiceNames"
                    }

                },
                {
                    $match: {
                        ServiceNames    : {$ne: []}
                    }
                },
                {
                  $project: {
                      nameKz: 1,
                      nameRu: 1,
                      code: 1
                  }
                },
                {
                    $limit: 5
                }
            ]);

            return resolve(serviceNames);

        } catch (err) {
            return reject(err)
        }
    })
};


const getByPageAndByServiceProvider = async (operatorId:string, query: string, page: number) => {
    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceName;

            let services = await Operator_ServiceProvider.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(operatorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-providers',
                        'let': {
                            'serviceProviderId': '$serviceProviderId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$serviceProviderId', '$$serviceProviderId'
                                        ]
                                    }
                                }
                            }
                        ],
                        'as': 'OSP'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSP',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'service-providers',
                        'localField': 'OSP.serviceProviderId',
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
                            'organizationId': '$OSP.organizationId',
                            'serviceProviderTypeId': '$ServiceProvider.serviceProviderTypeId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$serviceProviderTypeId', '$$serviceProviderTypeId'
                                        ]
                                    }
                                }
                            }, {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$organizationId', '$$organizationId'
                                        ]
                                    }
                                }
                            }
                        ],
                        'as': 'OSPT'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSPT',
                        'preserveNullAndEmptyArrays': true
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
                                    }
                                }
                            }
                        ],
                        'as': 'OSPT_SN'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSPT_SN',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'service-names',
                        'let': {
                            'serviceNameId': '$OSPT_SN.serviceNameId'
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
                            }
                        ],
                        'as': 'ServiceName'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceName'
                    }
                }, {
                    '$project': {
                        '_id': '$ServiceName._id',
                        'nameKz': '$ServiceName.nameKz',
                        'nameRu': '$ServiceName.nameRu'
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

                        serviceNames: [
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
                        serviceNames: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(services[0]);

        } catch (err) {
            return reject(err)
        }
    })
};


const getByPageAndBySupervisorsServiceProviders = async (supervisorId:string, query: string, page: number) => {
    return new Promise(async (resolve, reject) => {

        try {

            console.log(supervisorId);

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceName;


            let services = await Supervisor_ServiceProvider.aggregate([
                {
                    '$match': {
                        'userId': new ObjectId(supervisorId)
                    }
                }, {
                    '$lookup': {
                        'from': 'user-organizations',
                        'localField': 'userId',
                        'foreignField': 'userId',
                        'as': 'UserOrganization'
                    }
                }, {
                    '$unwind': {
                        'path': '$UserOrganization',
                        'preserveNullAndEmptyArrays': true
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
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$group': {
                        '_id': '$ServiceProvider.serviceProviderTypeId',
                        'organizationId': {
                            '$addToSet': '$UserOrganization.organizationId'
                        }
                    }
                }, {
                    '$unwind': {
                        'path': '$organizationId',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-provider-types',
                        'let': {
                            'organizationId': '$organizationId',
                            'serviceProviderTypeId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$organizationId', '$$organizationId'
                                        ]
                                    }
                                }
                            }, {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$serviceProviderTypeId', '$$serviceProviderTypeId'
                                        ]
                                    }
                                }
                            }
                        ],
                        'as': 'OSPT'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSPT',
                        'preserveNullAndEmptyArrays': true
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
                                    }
                                }
                            }
                        ],
                        'as': 'OSPT_SN'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSPT_SN',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$lookup': {
                        'from': 'service-names',
                        'let': {
                            'serviceNameId': '$OSPT_SN.serviceNameId'
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
                            }
                        ],
                        'as': 'ServiceName'
                    }
                }, {
                    '$unwind': {
                        'path': '$ServiceName'
                    }
                }, {
                    '$project': {
                        'nameKz': '$ServiceName.nameKz',
                        'nameRu': '$ServiceName.nameRu',
                        'code': '$ServiceName.code'
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

                        serviceNames: [
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
                        serviceNames: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(services[0]);

        } catch (err) {
            return reject(err)
        }
    })
};


const getByOrganizationId = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {
            console.log(organizationId);

            let serviceNames = OSPT.aggregate([
                {
                    $match: {
                        organizationId: ObjectId(organizationId),
                        suspended: false
                    },

                },
                {
                    $lookup: {
                        from: "o_spt_servicenames",
                        let: {
                            "osptId": "$_id"
                        },
                        pipeline: [
                            {
                                $match:
                                    {
                                        $expr: {
                                            $eq: ["$osptId", "$$osptId"]
                                        },
                                        suspended: false
                                    }
                            },
                            {
                                $lookup: {
                                    from: "service-names",
                                    let: {
                                        serviceNameId1: "$serviceNameId"
                                    },
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr: {
                                                        $eq: ["$_id", "$$serviceNameId1"]
                                                    },
                                                    suspended: false
                                                }
                                        },
                                        {
                                            $project: {
                                                nameRu: 1,
                                                nameKz: 1,
                                            }
                                        }
                                    ],
                                    as: "ServiceNames"
                                }
                            },
                            {
                                $unwind: "$ServiceNames"
                            },
                            {
                                $project: {
                                    'id': '$ServiceNames._id',
                                    'nameRu': '$ServiceNames.nameRu',
                                    'nameKz': '$ServiceNames.nameKz',
                                    'code': '$ServiceNames.code',
                                    _id: 0
                                }
                            },


                        ],
                        as: "services"
                    }
                },

                {
                    $lookup: {
                        from: "service-provider-types",
                        let: { serviceProviderTypeId: "$serviceProviderTypeId" },
                        pipeline: [
                            {
                                $match:
                                    {
                                        $expr: {
                                            $eq: ["$_id", "$$serviceProviderTypeId"]
                                        },
                                        suspended: false
                                    }
                            },
                            {
                                $project: {
                                    nameRu: 1,
                                    nameKz: 1,
                                    // _id: 0
                                }
                            }
                        ],
                        as: "serviceProviderType"
                    }
                },

                {
                    $unwind: "$serviceProviderType"
                },


                // {
                //     $unwind: "$OSPTSN"
                // },

                // {
                //     $lookup: {
                //         "from": "O_SPT_ServiceName",
                //         localField: "_id",
                //         foreignField: "osptId",
                //         // "let": {
                //         //     "osptId": "$_id"
                //         // },
                //         // "pipeline": [
                //         //     // { "$match": { "$expr": { "$eq": ["$osptId", "$$osptId"] }}},
                //         //     {
                //         //         "$project": {
                //         //             "osptId": 1,
                //         //             "serviceNameId": 1
                //         //         }
                //         //     }
                //         // ],
                //         as: "OSPTSN"
                //     }
                // },

                // {
                //     $unwind: '$OSPTSN'
                // },

                // {
                //     $unwind: "$consumable"
                // },
                // {
                //     $replaceRoot: { newRoot: "$consumable" }
                // },

                // {
                //     $group: {
                //         _id: "$_id",
                //         name: { $first: "$name" },
                //         count: { $sum: 1 }
                //     }
                // },
                // { $sort: { name: 1 } } // can use count for sorting as well

                {
                    $project: {
                        _id: 0,
                        "serviceProviderType": '$serviceProviderType',
                        "services": "$services"
                    }
                }
            ]);

            // let serviceNames = OSPT.find();

            return resolve(serviceNames);

        } catch (err) {
            return reject(err);
        }

    });

};


const getByPageAndByOrganizationId = async (organizationId: string, query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {


            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceName;

            const serviceNames = await OSPT.aggregate([
                {
                    '$match': {
                        'organizationId': new ObjectId(organizationId),
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'o_spt_servicenames',
                        'let': {
                            'osptId': '$_id'
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
                                        'serviceNameId1': '$serviceNameId'
                                    },
                                    'pipeline': [
                                        {
                                            '$match': {
                                                '$expr': {
                                                    '$eq': [
                                                        '$_id', '$$serviceNameId1'
                                                    ]
                                                },
                                                'suspended': false
                                            }
                                        }, {
                                            '$project': {
                                                'nameRu': 1,
                                                'nameKz': 1
                                            }
                                        }
                                    ],
                                    'as': 'ServiceNames'
                                }
                            }, {
                                '$unwind': '$ServiceNames'
                            }, {
                                '$project': {
                                    'id': '$ServiceNames._id',
                                    'nameRu': '$ServiceNames.nameRu',
                                    'nameKz': '$ServiceNames.nameKz',
                                    'code': '$ServiceNames.code',
                                    '_id': 0
                                }
                            }
                        ],
                        'as': 'services'
                    }
                }, {
                    '$lookup': {
                        'from': 'service-provider-types',
                        'let': {
                            'serviceProviderTypeId': '$serviceProviderTypeId'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$_id', '$$serviceProviderTypeId'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$project': {
                                    'nameRu': 1,
                                    'nameKz': 1
                                }
                            }
                        ],
                        'as': 'serviceProviderType'
                    }
                }, {
                    '$unwind': '$serviceProviderType'
                }, {
                    '$project': {
                        '_id': 0,
                        'serviceProviderType': '$serviceProviderType',
                        'services': '$services'
                    }
                }, {
                    '$unwind': {
                        'path': '$services'
                    }
                }, {
                    '$project': {
                        '_id': '$services.id',
                        'nameRu': '$services.nameRu',
                        'nameKz': '$services.nameKz',
                        'serviceProviderType': '$serviceProviderType'
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

                        serviceNames: [
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
                        serviceNames: 1,
                        total: "$metadata.total",
                        currentPage: "$metadata.currentPage",
                        pageSize: 1
                    }
                }
            ]);

            return resolve(serviceNames[0]);

        } catch (err) {
            return reject(err.message);
        }

    });
};


const getByPage = async (query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(page);

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceName;

            const count = await ServiceName.find({
                nameRu: new RegExp(query, "i"),
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);
            console.log(skip);

            let serviceNames = await ServiceName.find(
                {
                    nameRu: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({nameRu: 1})
                .skip(skip)
                .limit(limit);

            return resolve({serviceNames, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err.message);
        }

    });
};


const create = async ({nameKz, nameRu, code}: ServiceNameProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceName = new ServiceName({
                nameKz,
                nameRu,
                code
            });

            newServiceName = await newServiceName.save();

            return resolve(newServiceName);

        } catch (err) {
            return reject(err);
        }

    });

};

const createAndConnect = async ({nameKz, nameRu, code}: ServiceNameProps, {osptId}: OSPTServiceNameProps) => {
    return new Promise(async (resolve, reject) => {

        try {

            // let newServiceName = new ServiceName({
            //     nameKz,
            //     nameRu,
            //     code
            // });

            let updated_ServiceName = await ServiceName.findOneAndUpdate({
                nameKz,
                nameRu,
            }, {
                code,
                suspended: false
            }, {new: true, upsert: true});

            // newServiceName = await newServiceName.save();

            let newOSPT_SN = new OSPT_SN({
                osptId: osptId,
                serviceNameId: updated_ServiceName._id
            });

            newOSPT_SN = await newOSPT_SN.save();


            return resolve({updated_ServiceName, newOSPT_SN});

        } catch (err) {
            return reject(err);
        }

    });

};


const connect = async (osptId: string, serviceNameId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updated_OSPT_SN = await OSPT_SN.findOneAndUpdate({
                osptId,
                serviceNameId
            }, {
                suspended: false
            }, {new: true, upsert: true});

            return resolve(updated_OSPT_SN);

        } catch (err) {
            return reject(err);
        }

    })

};


const suspendRelation = async (ospt_snId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let suspendedOSPT_SN_Relation = await OSPT_SN.findByIdAndUpdate(ospt_snId,
                { suspended: true },
                { new: true }
                );

            return resolve(suspendedOSPT_SN_Relation);

        } catch (err) {
            return reject(err);
        }

    })

};


const update = async (serviceNameId: string, {nameKz, nameRu, code}: ServiceNameProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updatedServiceName = await ServiceName.findByIdAndUpdate(serviceNameId, {
                    nameKz,
                    nameRu,
                    code
                }, {new: true}
            );

            return resolve(updatedServiceName);

        } catch (err) {
            return reject(err);
        }

    });

};


const suspend = async (serviceNameId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let suspendedServiceName = await ServiceName.findByIdAndUpdate(serviceNameId,
                { suspended: true },
                { new: true }
            ).session(session);

            let suspendedOSPT_SN_Relations = await OSPT_SN.updateMany({
                serviceNameId
            }, {
                $set: {
                    suspended: true
                }
            }, {session}
            );

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedServiceName, suspendedOSPT_SN_Relations});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    })

};


export = {
    get,
    getByServiceProviderType,
    getByPageAndByServiceProvider,
    getByPageAndBySupervisorsServiceProviders,
    getByOrganizationId,
    getByPageAndByOrganizationId,
    getByPage,
    create,
    createAndConnect,
    connect,
    update,
    suspendRelation,
    suspend
}


