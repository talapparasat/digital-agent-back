import OSPT, {OrganizationServiceProviderTypeProps} from '@db/Organization_Service-provider-type';
import ServiceCategory, {ServiceCategoryProps} from '@db/Service-category';
import ServiceCriteria, {ServiceCriteriaProps} from '@db/Service-criteria';
import OSPT_SC, {OSPTServiceCateogoryProps} from '@db/OSPT_Service-category';
import OSPT_SC_SC, {OSPT_SC_ServiceCriteriaProps} from '@db/OSPT_SC_SC';
import mongoose from "mongoose";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
import ServiceName from "@db/Service-name";

const ObjectId = mongoose.Types.ObjectId;


const getByServiceProviderType = async (serviceProviderTypeId: string, serviceCategoryId: string,
                                        query: string, lang: string) => {
    return new Promise(async (resolve, reject) => {

        try {

            let regex = {};

            if (lang == 'kz') {
                regex = {nameKz: new RegExp(query, "i")}
            } else {
                regex = {nameRu: new RegExp(query, "i")}
            }

            let categoryMatch = {};

            if (serviceCategoryId != "") {
                categoryMatch = {
                    serviceCategoryId: ObjectId(serviceCategoryId)
                }
            }

            console.log(categoryMatch);

            let serviceCategories = await ServiceCriteria.aggregate([
                {
                    $match: {
                        ...regex,
                        suspended: false
                    }
                },
                // {
                //     $lookup: {
                //         from: "ospt_sc_scs",
                //         let: {"serviceCriteriaId": "$_id"},
                //         pipeline: [
                //             {
                //                 $match:
                //                     {
                //                         $expr: {
                //                             $eq: ["$serviceCriteriaId", "$$serviceCriteriaId"]
                //                         },
                //                         // suspended: false
                //                     }
                //             },
                //             {
                //                 $lookup: {
                //                     from: "ospt_service-categories",
                //                     let: {ospt_scId: "$osptServiceCategoryId"},
                //                     pipeline: [
                //                         {
                //                             $match:
                //                                 {
                //                                     $expr: {
                //                                         $eq: ["$_id", "$$ospt_scId"]
                //                                     },
                //                                     ...categoryMatch,
                //                                     suspended: false
                //                                 }
                //                         },
                //                         {
                //                             $lookup: {
                //                                 from: "organization_service-provider-types",
                //                                 let: {"osptId": "$osptId"},
                //                                 pipeline: [
                //                                     {
                //                                         $match:
                //                                             {
                //                                                 $expr: {
                //                                                     $eq: ["$_id", "$$osptId"]
                //                                                 },
                //                                                 serviceProviderTypeId: ObjectId(serviceProviderTypeId),
                //                                                 suspended: false
                //                                             }
                //                                     }
                //                                 ],
                //                                 as: "OSPT"
                //                             },
                //                         },
                //                         {
                //                             $match: {
                //                                 OSPT: {$ne: []}
                //                             }
                //                         }
                //                     ],
                //                     as: "OSPT_SC"
                //                 },
                //             },
                //             {
                //                 $match: {
                //                     OSPT_SC: {$ne: []}
                //                 }
                //             }
                //         ],
                //         as: "ServiceCriterias"
                //     }
                //
                // },
                // {
                //     $match: {
                //         ServiceCriterias: {$ne: []}
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


const getByOrganizationId = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceCriteriass = OSPT.aggregate([
                {
                    $match: {
                        organizationId: ObjectId(organizationId),
                        suspended: false
                    },
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
                                $lookup: {
                                    from: "ospt_sc_scs",
                                    let: {
                                        ospt_scId: "$_id"
                                    },
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr: {
                                                        $eq: ["$osptServiceCategoryId", "$$ospt_scId"]
                                                    },
                                                    suspended: false
                                                }
                                        },
                                        {
                                            $lookup: {
                                                from: 'service-criterias',
                                                let: {
                                                    serviceCriteriaId: "$serviceCriteriaId"
                                                },
                                                pipeline: [
                                                    {
                                                        $match:
                                                            {
                                                                $expr: {
                                                                    $eq: ["$_id", "$$serviceCriteriaId"]
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
                                                as: "criteria"
                                            }
                                        },
                                        {
                                            $unwind: "$criteria"
                                        },
                                        {
                                            $project: {
                                                'id': '$criteria._id',
                                                'nameRu': '$criteria.nameRu',
                                                'nameKz': '$criteria.nameKz',
                                                _id: 0
                                            }
                                        },
                                    ],
                                    as: "criterias"
                                }
                            },

                            {
                                $project: {
                                    'id': '$ServiceCategories._id',
                                    'nameRu': '$ServiceCategories.nameRu',
                                    'nameKz': '$ServiceCategories.nameKz',
                                    'criterias': '$criterias',
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

            return resolve(serviceCriteriass);

        } catch (err) {
            return reject(err);
        }

    });

};


const getByPage = async (query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(page);

            const limit = NUMBER_OF_RESULTS_PER_PAGE.serviceCriteria;

            const count = await ServiceCriteria.find({
                nameRu: new RegExp(query, "i"),
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);
            console.log(skip);

            let serviceCriterias = await ServiceCriteria.find(
                {
                    nameRu: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({nameRu: 1})
                .skip(skip)
                .limit(limit);

            return resolve({serviceCriterias, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err.message);
        }

    });
};


const create = async ({nameKz, nameRu}: ServiceCriteriaProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceCriteria = new ServiceCriteria({
                nameKz,
                nameRu,
            });

            newServiceCriteria = await newServiceCriteria.save();

            return resolve(newServiceCriteria);

        } catch (err) {
            return reject(err);
        }

    });

};

const createAndConnect = async ({nameKz, nameRu}: ServiceCriteriaProps, ospt_scId: string) => {

    return new Promise(async (resolve, reject) => {

        try {
            console.log(ospt_scId);

            // let newServiceCriteria = new ServiceCriteria({
            //     nameKz,
            //     nameRu,
            // });

            let updated_ServiceCriteria = await ServiceCriteria.findOneAndUpdate({
                nameKz,
                nameRu,
            }, {
                suspended: false
            }, {new: true, upsert: true});

            // newServiceCriteria = await newServiceCriteria.save();

            let newOSPT_SC = new OSPT_SC_SC({
                osptServiceCategoryId: ospt_scId,
                serviceCriteriaId: updated_ServiceCriteria._id
            });

            newOSPT_SC = await newOSPT_SC.save();


            return resolve({updated_ServiceCriteria, newOSPT_SC});

        } catch (err) {
            return reject(err);
        }

    });

};


const connectToOrganization = async ({osptServiceCategoryId, serviceCriteriaId}: OSPT_SC_ServiceCriteriaProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updatedOSPT_SC_SC = await OSPT_SC_SC.findOneAndUpdate({
                osptServiceCategoryId,
                serviceCriteriaId
            }, {
                $set: {
                    osptServiceCategoryId,
                    serviceCriteriaId,
                    suspended: false
                }
            }, {
                new: true, upsert: true
            });

            return resolve(updatedOSPT_SC_SC);

        } catch (err) {
            return reject(err);
        }

    });

};


const update = async (serviceCriteriaId: string, {nameKz, nameRu}: ServiceCriteriaProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let updatedServiceCriteria = await ServiceCriteria.findByIdAndUpdate(serviceCriteriaId, {
                    nameKz,
                    nameRu
                }, { new: true }
            );

            return resolve(updatedServiceCriteria);

        } catch (err) {
            return reject(err);
        }

    });

};


const suspendRelation = async (ospt_sc_scId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let suspendedRelation = await OSPT_SC_SC.findByIdAndUpdate(ospt_sc_scId,
                {suspended: true},
                {new: true}
            );

            console.log(suspendedRelation);

            return resolve(suspendedRelation);

        } catch (err) {
            return reject(err);
        }

    });

};


const suspend = async (serviceCriteriaId: string) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let suspendedServiceCriteria = await ServiceCriteria.findByIdAndUpdate(serviceCriteriaId,
                {suspended: true},
                {new: true}
            ).session(session);

            let suspendedRelations = await OSPT_SC_SC.updateMany({
                    serviceCriteriaId,
                    suspended: false
                }, {
                    $set: {
                        suspended: true
                    }
                }, {session}
            );

            await session.commitTransaction();
            session.endSession();

            return resolve({suspendedServiceCriteria, suspendedRelations});

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