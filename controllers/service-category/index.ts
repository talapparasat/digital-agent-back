import OSPT, {OrganizationServiceProviderTypeProps} from '@db/Organization_Service-provider-type';
import ServiceCategory, {ServiceCategoryProps} from '@db/Service-category';
import OSPT_SC, {OSPTServiceCateogoryProps} from '@db/OSPT_Service-category';
import OSPT_SC_SC, {OSPT_SC_ServiceCriteriaProps} from '@db/OSPT_SC_SC';
import mongoose from "mongoose";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import ServiceName from "@db/Service-name";
import {ServiceCriteriaProps} from "@db/Service-criteria";
import ServiceCriteria from "@db/Service-criteria";

const ObjectId = mongoose.Types.ObjectId;


const getByServiceProviderType = async (serviceProviderTypeId: string, query: string, lang: string) => {
    return new Promise(async (resolve, reject) => {

        try {

            let regex = {};

            if (lang == 'kz') {
                regex = {nameKz: new RegExp(query, "i")}
            } else {
                regex = {nameRu: new RegExp(query, "i")}
            }

            let serviceCategories = await ServiceCategory.aggregate([
                {
                    $match: {
                        ...regex,
                        suspended: false
                    }
                },
                // {
                //     $lookup: {
                //         from: "ospt_service-categories",
                //         let: {"serviceCategoryId": "$_id"},
                //         pipeline: [
                //             {
                //                 $match:
                //                     {
                //                         $expr: {
                //                             $eq: ["$serviceCategoryId", "$$serviceCategoryId"]
                //                         },
                //                         // suspended: false
                //                     }
                //             },
                //             {
                //                 $lookup: {
                //                     from: "organization_service-provider-types",
                //                     let: {"osptId": "$osptId"},
                //                     pipeline: [
                //                         {
                //                             $match:
                //                                 {
                //                                     $expr: {
                //                                         $eq: ["$_id", "$$osptId"]
                //                                     },
                //                                     serviceProviderTypeId: ObjectId(serviceProviderTypeId),
                //                                     suspended: false
                //                                 }
                //                         }
                //                     ],
                //                     as: "OSPT"
                //                 },
                //             },
                //             {
                //                 $match: {
                //                     OSPT: {$ne: []}
                //                 }
                //             }
                //         ],
                //         as: "ServiceCategories"
                //     }
                //
                // },
                // {
                //     $match: {
                //         ServiceCategories: {$ne: []}
                //     }
                // },
                {
                    $project: {
                        nameKz: 1,
                        nameRu: 1,
                    }
                },
                {
                    $limit: 5
                }
            ]);

            return resolve(serviceCategories);

        } catch (err) {
            return reject(err)
        }
    })
};


const getByOrganizationId = async (organizationId: string, serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviderTypeMatch = {};

            if (serviceProviderTypeId != "") {
                serviceProviderTypeMatch = {
                    serviceProviderTypeId: ObjectId(serviceProviderTypeId)
                }
            }

            let serviceCategories = OSPT.aggregate([
                {
                    $match: {
                        organizationId: ObjectId(organizationId),
                        ...serviceProviderTypeMatch,
                        suspended: false
                    }
                },

                {
                    $lookup: {
                        from: "ospt_service-categories",
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
                                    from: "service-categories",
                                    let: {
                                        serviceCategoryId: "$serviceCategoryId"
                                    },
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr: {
                                                        $eq: ["$_id", "$$serviceCategoryId"]
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
                                    as: "ServiceCategories"
                                }
                            },
                            {
                                $unwind: "$ServiceCategories"
                            },
                            {
                                $project: {
                                    'id': '$ServiceCategories._id',
                                    'nameRu': '$ServiceCategories.nameRu',
                                    'nameKz': '$ServiceCategories.nameKz',
                                    _id: 0
                                }
                            },


                        ],
                        as: "categories"
                    }
                },

                {
                    $lookup: {
                        from: "service-provider-types",
                        let: {serviceProviderTypeId: "$serviceProviderTypeId"},
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
                                }
                            }
                        ],
                        as: "serviceProviderType"
                    }
                },

                {
                    $unwind: "$serviceProviderType"
                },

                {
                    $project: {
                        _id: 0,
                        "serviceProviderType": '$serviceProviderType',
                        "categories": "$categories"
                    }
                }
            ]);

            return resolve(serviceCategories);

        } catch (err) {
            return reject(err);
        }

    });

};


const getByPage = async (query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(page);

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceCategory;

            const count = await ServiceCategory.find({
                nameRu: new RegExp(query, "i"),
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);
            console.log(skip);

            let serviceCategories = await ServiceCategory.find(
                {
                    nameRu: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({nameRu: 1})
                .skip(skip)
                .limit(limit);

            return resolve({serviceCategories, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err.message);
        }

    });
};


const create = async ({nameKz, nameRu, image}: ServiceCategoryProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceCategory = new ServiceCategory({
                nameKz,
                nameRu,
                image
            });

            newServiceCategory = await newServiceCategory.save();

            return resolve(newServiceCategory);

        } catch (err) {
            return reject(err);
        }

    });

};

const createAndConnect = async ({nameKz, nameRu, image}: ServiceCategoryProps, osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {
            //
            // let newServiceCategory = new ServiceCategory({
            //     nameKz,
            //     nameRu,
            //     image
            // });

            let updated_ServiceCategory = await ServiceCategory.findOneAndUpdate({
                nameKz,
                nameRu,
            }, {
                image,
                suspended: false
            }, {new: true, upsert: true});

            // newServiceCategory = await newServiceCategory.save();

            // await updated_ServiceCategory.save();

            console.log(updated_ServiceCategory);

            let newOSPT_SC = new OSPT_SC({
                osptId: osptId,
                serviceCategoryId: updated_ServiceCategory._id
            });

            newOSPT_SC = await newOSPT_SC.save();

            return resolve({updated_ServiceCategory, newOSPT_SC});

        } catch (err) {
            return reject(err);
        }

    });

};

const connectToOrganization = async ({osptId, serviceCategoryId}: OSPTServiceCateogoryProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOSPT_SC = new OSPT_SC({
                osptId,
                serviceCategoryId
            });

            let updatedOSPT_SC = await OSPT_SC.findOneAndUpdate({
                osptId,
                serviceCategoryId
            }, {
                $set: {
                    osptId,
                    serviceCategoryId,
                    suspended: false
                }
            }, {
                new: true, upsert: true
            });

            return resolve(updatedOSPT_SC);

        } catch (err) {
            return reject(err);
        }

    });

};


const update = async (serviceCategoryId: string, {nameKz, nameRu, image}: ServiceCategoryProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updatedServiceCategory = await ServiceCategory.findByIdAndUpdate(serviceCategoryId, {
                    nameKz,
                    nameRu,
                    image
                }, {new: true}
            );

            return resolve(updatedServiceCategory);

        } catch (err) {
            return reject(err);
        }

    });

};


const suspendRelation = async (ospt_scId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            console.log({ospt_scId});

            let suspendedRelation = await OSPT_SC.findByIdAndUpdate(ospt_scId,
                {suspended: true},
                {new: true}
            );

            let suspendedCriteriaRelations = await OSPT_SC_SC.updateMany(
                {
                    osptServiceCategoryId: ospt_scId,
                },
                {
                    suspended: true
                });

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedRelation, suspendedCriteriaRelations});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


const suspend = async (serviceCategoryId: string) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let suspendedServiceCategory = await ServiceCategory.findByIdAndUpdate(serviceCategoryId,
                {suspended: true},
                {new: true}
            ).session(session);

            let relatedOSPT_SC_Ids = await OSPT_SC.find({
                    serviceCategoryId,
                    suspended: false
                }, {
                    _id: 1
                },
                {
                    session
                }
            );

            relatedOSPT_SC_Ids = relatedOSPT_SC_Ids.map((item) => {
                return item._id
            });

            let suspendedOSPR_SC_Relations = await OSPT_SC.updateMany({
                    _id: {$in: [...relatedOSPT_SC_Ids]},
                    suspended: false
                }, {
                    suspended: true
                }, {session}
            );

            let suspended_OSPT_SC_SC_Relations = await OSPT_SC_SC.updateMany({
                    osptServiceCategoryId: {$in: [...relatedOSPT_SC_Ids]},
                    suspended: false
                }, {
                    suspended: true
                }, {session}
            );

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedServiceCategory, suspendedOSPR_SC_Relations, suspended_OSPT_SC_SC_Relations});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


export = {
    getByServiceProviderType,
    getByOrganizationId,
    getByPage,
    create,
    createAndConnect,
    connectToOrganization,
    update,
    suspendRelation,
    suspend
}