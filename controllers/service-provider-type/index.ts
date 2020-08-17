import ServiceProviderType, {ServiceProviderTypeProps} from '@db/Service-provider-type';
import ServiceProvider from '@db/Service-provider';
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import OrganizationServiceProviderType from "@db/Organization_Service-provider-type";
import OSPT_SC, {OSPTServiceCateogoryProps} from '@db/OSPT_Service-category';
import OSPT_SC_SC from "@db/OSPT_SC_SC";
import mongoose from "mongoose";
import {or} from "sequelize";

const ObjectId = mongoose.Types.ObjectId;


const getAll = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderTypes = await ServiceProviderType.find({suspended: false}, 'nameKz nameRu image');

            return resolve(serviceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};


const getOrganizationsOfServiceProvider = async (serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organizations = await OrganizationServiceProviderType.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': new ObjectId(serviceProviderTypeId),
                        'suspended': false
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
                                    nameRu: '$nameRu',
                                    nameKz: '$nameKz',
                                    image: '$image'
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
                    '$replaceRoot': {
                        'newRoot': '$Organization'
                    }
                }
            ]);

            organizations = organizations ? organizations : [];
            return resolve(organizations);

        } catch (err) {
            return reject(err);
        }

    });
};


const getAllWithServicesCountAndOrgCount = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderTypes = await ServiceProviderType.aggregate([
                {
                    '$match': {
                        'suspended': false,
                        'isActive': true
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-provider-types',
                        'let': {
                            'serviceProviderTypeId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$serviceProviderTypeId', '$$serviceProviderTypeId'
                                        ]
                                    },
                                    'suspended': false
                                }
                            }, {
                                '$count': 'total'
                            }
                        ],
                        'as': 'organizationCount'
                    }
                }, {
                    '$unwind': {
                        'path': '$organizationCount',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$sort': {
                        'isGovernment': -1,
                        'isActive': -1,
                        'order': 1
                    }
                }, {
                    '$project': {
                        'nameKz': 1,
                        'nameRu': 1,
                        'image': 1,
                        'isActive': 1,
                        'isGovernment': 1,
                        'organizationCount': '$organizationCount.total'
                    }
                }
            ]);

            let serviceProvidersCount = await ServiceProvider.countDocuments();

            return resolve({serviceProviderTypes, totalServiceProviders: serviceProvidersCount});

        } catch (err) {
            return reject(err);
        }

    });
};


const getById = async (id: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderType = await ServiceProviderType.findById(id);

            return resolve(serviceProviderType);

        } catch (err) {
            return reject(err);
        }

    });
};


const get = async (findRequestData: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderTypes = await ServiceProviderType.find({...findRequestData, suspended: false});

            return resolve(serviceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByPage = async (query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(page);

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceProviderType;

            const count = await ServiceProviderType.find({
                nameRu: new RegExp(query, "i"),
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);
            console.log(skip);

            let serviceProviderTypes = await ServiceProviderType.find(
                {
                    nameRu: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({order: 1})
                .skip(skip)
                .limit(limit);


            return resolve({serviceProviderTypes, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err.message);
        }

    });
};


const getByOrganizationId = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderTypesOfOrg = await OrganizationServiceProviderType.aggregate([
                {
                    $match: {
                        organizationId: ObjectId(organizationId),
                        suspended: false
                    },

                },
                {
                    $lookup: {
                        from: "service-provider-types",
                        let: {"serviceProviderTypeId": "$serviceProviderTypeId"},
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
                        ],
                        as: "ServiceProviderType"
                    }
                },
                {
                    $unwind: '$ServiceProviderType'
                },
                {
                    $project: {
                        _id: 0,
                        "id": "$ServiceProviderType._id",
                        "nameKz": "$ServiceProviderType.nameKz",
                        "nameRu": "$ServiceProviderType.nameRu",
                        "image": "$ServiceProviderType.image",
                        "survey": "$survey",
                    }
                }
            ]);

            let total = await ServiceProviderType.count({
                suspended: false
            });

            return resolve({spts: serviceProviderTypesOfOrg, total});

        } catch (err) {
            return reject(err);
        }

    });
};


const create = async ({nameKz, nameRu, image, order, isGovernment}: ServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            order = await normalizeOrder(order, session);


            let newServiceProviderType = new ServiceProviderType({
                nameKz,
                nameRu,
                image,
                order,
                isGovernment
            });

            newServiceProviderType = await newServiceProviderType.save({session});

            await session.commitTransaction();
            session.endSession();

            return resolve(newServiceProviderType);

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            console.log(err);
            return reject(err);
        }

    });
};


const update = async (serviceProviderTypeId: string, {nameKz, nameRu, image, order, isGovernment, isActive}: ServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            order = await normalizeOrderUpdate(order, session, serviceProviderTypeId);

            let updatedServiceProviderType = await ServiceProviderType.findByIdAndUpdate(serviceProviderTypeId,
                {
                    nameKz,
                    nameRu,
                    image,
                    order,
                    isGovernment,
                    isActive
                }, {new: true}
            ).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve(updatedServiceProviderType);

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const createAndConnect = async (organizationId: string, {nameKz, nameRu, image, order}: ServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            order = await normalizeOrder(order, session);

            let newServiceProviderType = new ServiceProviderType({
                nameKz,
                nameRu,
                image,
                order
            });

            newServiceProviderType = await newServiceProviderType.save();


            let newOSPT = new OrganizationServiceProviderType({
                organizationId,
                serviceProviderTypeId: newServiceProviderType._id,
            });

            newOSPT = await newOSPT.save();

            await session.commitTransaction();
            session.endSession();

            return resolve({newServiceProviderType, newOSPT});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};

const connect = async (organizationId: string, serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOSPT = new OrganizationServiceProviderType({
                organizationId,
                serviceProviderTypeId,
            });

            newOSPT = await newOSPT.save();


            return resolve(newOSPT);

        } catch (err) {
            return reject(err);
        }

    });
};


const activateDeactivate = async (serviceProviderTypeId: string, isActivate: boolean) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderType = await ServiceProviderType.findByIdAndUpdate(serviceProviderTypeId, {
                isActive: isActivate
            }, {new: true});

            return resolve(serviceProviderType);

        } catch (err) {
            return reject(err);
        }

    });
};


const suspendRelation = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let suspendedOSPT = await OrganizationServiceProviderType.findByIdAndUpdate(osptId,
                {suspended: true},
                {new: true}
            ).session(session);

            let relatedCategoryIds = await OSPT_SC.find({
                osptId
            }, '_id', {session});

            relatedCategoryIds = relatedCategoryIds.map((item) => {
                return item._id
            });

            console.log({relatedCategoryIds});

            let suspendedCategoryRelations = await OSPT_SC.updateMany({
                _id: {$in: [...relatedCategoryIds]}
            }, {
                $set: {
                    suspended: true
                }
            }, {session});

            let suspendedCriteriaRelations = await OSPT_SC_SC.updateMany({
                    osptServiceCategoryId: {$in: [...relatedCategoryIds]}
                }, {
                    $set: {
                        suspended: true
                    }
                }, {session}
            );

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedOSPT, suspendedCategoryRelations, suspendedCriteriaRelations});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const suspend = async (serviceProviderTypeId: string) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let suspendedServiceProviderType = await ServiceProviderType.findByIdAndUpdate(serviceProviderTypeId,
                {suspended: true},
                {new: true}
            );

            let relatedOsptIds = await OrganizationServiceProviderType.find({
                    serviceProviderTypeId,
                    suspended: false
                }, {
                    _id: 1
                }, {session}
            );

            relatedOsptIds = relatedOsptIds.map((item) => {
                return item._id
            });

            let suspendedOsptRelations = await OrganizationServiceProviderType.updateMany({
                    _id: {$in: [...relatedOsptIds]}
                }, {
                    $set: {
                        suspended: true
                    }
                }, {session}
            );

            let related_OSPT_SC_Ids = await OSPT_SC.find({
                    osptId: {$in: [...relatedOsptIds]},
                    suspended: false
                }, {
                    _id: 1
                }, {session}
            );

            related_OSPT_SC_Ids = related_OSPT_SC_Ids.map((item) => {
                return item._id
            });

            let suspendedOSPT_SC_Relations = await OSPT_SC.updateMany({
                _id: {$in: [...related_OSPT_SC_Ids]}
            }, {
                $set: {
                    suspended: true
                }
            });

            let suspendedOSPT_SC_SC_Relations = await OSPT_SC_SC.updateMany({
                    osptServiceCategoryId: {$in: [...related_OSPT_SC_Ids]},
                    suspended: false
                }, {
                    $set: {
                        suspended: true
                    }
                }, {session}
            );

            await normalizeOrderDelete(suspendedServiceProviderType.order, session, serviceProviderTypeId);

            await session.commitTransaction();
            session.endSession();

            return resolve({
                suspendedServiceProviderType,
                suspendedOsptRelations,
                suspendedOSPT_SC_Relations,
                suspendedOSPT_SC_SC_Relations
            });

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const normalizeOrder = async (order: number, session: any) => {

    let maxOrder = await ServiceProviderType.find().sort('-order').limit(1).select('-_id order');

    console.log(maxOrder);

    if (maxOrder.length == 0) {
        return 1;
    }

    if (!order) {
        return Number(maxOrder[0].order) + 1;
    }


    if (order > Number(maxOrder[0].order) + 1) {
        return Number(maxOrder[0].order) + 1;
    }


    await ServiceProviderType.updateMany({
        order: {$gte: order},
    }, {
        $inc: {
            order: 1
        }
    }, {session});

    if (order < 1) {
        return 1;
    }

    return order;

};


const normalizeOrderUpdate = async (order: number, session: any, id: string) => {
    let serviceProviderType = await ServiceProviderType.findById(id).session(session);

    console.log("Order:", order);
    console.log("SOrder:",  serviceProviderType.order);
    if (!order || serviceProviderType.order === order) {
        console.log("Inside equal");
        return serviceProviderType.order;
    }

    let maxOrder = await ServiceProviderType.find().session(session).sort('-order').limit(1).select('-_id order');

    if (order > Number(maxOrder[0].order)) {

        if (Number(serviceProviderType.order) === Number(maxOrder[0].order)) {
            return maxOrder[0].order
        }

        await ServiceProviderType.updateMany({
            _id: {$ne: id},
            order: {
                $gt: Number(serviceProviderType.order)
            }
        }, {
            $inc: {
                order: -1
            }
        }, {session});

        return Number(maxOrder[0].order);

    } else if (order < 1) {

        if (Number(serviceProviderType.order) !== 1) {
            return 1;
        }

        await ServiceProviderType.updateMany({
            _id: {$ne: id},
            order: {
                $lte: Number(serviceProviderType.order)
            }
        }, {
            $inc: {
                order: 1
            }
        }, {session});

        return 1;
    } else if (serviceProviderType.order < order) {
        await ServiceProviderType.updateMany({
            $and: [
                {
                    order: {$lte: order}
                },
                {
                    order: {$gt: serviceProviderType.order}
                },
            ]
        }, {
            $inc: {
                order: -1
            }
        }, {session});

        return order;
    } else if (serviceProviderType.order > order) {
        await ServiceProviderType.updateMany({
            $and: [
                {
                    order: {$lt: serviceProviderType.order}
                },
                {
                    order: {$gte: order}
                },
            ]
        }, {
            $inc: {
                order: 1
            }
        }, {session});

        return order;
    }


};


const normalizeOrderDelete = async (order: number, session: any, id: string) => {

    let maxOrder = await ServiceProviderType.find().sort('-order').limit(1).select('-_id order');

    await ServiceProviderType.updateMany({
        order: {$gt: order},
    }, {
        $inc: {
            order: -1
        }
    }, {session});

    await ServiceProviderType.findByIdAndUpdate(id, {
        order: -1
    }).session(session);

    return order;

};


export = {
    getAll,
    getOrganizationsOfServiceProvider,
    getAllWithServicesCountAndOrgCount,
    get,
    getByPage,
    getByOrganizationId,
    getById,
    create,
    createAndConnect,
    connect,
    update,
    activateDeactivate,
    suspendRelation,
    suspend
};

