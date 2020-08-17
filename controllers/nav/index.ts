import Nav, {NavProps} from "@db/Nav";
import NavOSPT, {NavOSPTProps} from "@db/Nav_OSPT";
import ServiceProvider from "@db/Service-provider";
import mongoose from "mongoose";
import O_SP from "@db/Operator_Service-provider";
import OSPT from "@db/Organization_Service-provider-type"
import OSP from "@db/Organization_Service-provider"

import deleteActions from './delete'

const ObjectId = mongoose.Types.ObjectId;

const getAll = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let navs = await Nav.find({});

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getAllWithNestings = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            let notification = await Nav.aggregate([
                {
                    $match: {
                        prevId: null
                    }
                },
                {
                    $lookup: {
                        from: 'navs',
                        localField: '_id',
                        foreignField: 'prevId',
                        as: 'navs'
                    }
                }
            ]);

            return resolve(notification);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByOspt = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let osptNavs = await NavOSPT.find({
                osptId
            });

            let osptNavsIds = osptNavs.map((item) => {
                return item.navId
            });

            let navs = await Nav.aggregate([
                {
                    $match: {
                        prevId: null
                    }
                },
                {
                    $addFields: {
                        checked: {
                            $cond: {
                                if: {
                                    $in: ['$_id', osptNavsIds]
                                },
                                then: true,
                                else: false
                            }
                        }
                    }
                },
                {
                    $lookup: {
                        from: 'navs',
                        let: {'navId': '$_id'},
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $eq: ['$prevId', '$$navId']
                                    }
                                }
                            },
                            {
                                $addFields: {
                                    checked: {
                                        $cond: {
                                            if: {
                                                $in: ['$_id', osptNavsIds]
                                            },
                                            then: true,
                                            else: false
                                        }
                                    }
                                }
                            },
                        ],
                        as: 'navs'
                    }
                }
            ]);

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByOsptAndByPrevId = async (osptId: string, prevId: string | null) => {

    return new Promise(async (resolve, reject) => {

        try {

            let navs = await NavOSPT.aggregate([
                {
                    $match: {
                        osptId: ObjectId(osptId)
                    }
                },
                {
                    $lookup: {
                        from: 'navs',
                        localField: 'navId',
                        foreignField: '_id',
                        as: 'Nav'
                    }
                },
                {
                    $unwind: '$Nav'
                },
                {
                    $match: {
                        'Nav.prevId': prevId ? ObjectId(prevId) : null
                    }
                },
                {
                    $replaceRoot: {
                        newRoot: '$Nav'
                    }
                }
            ]);

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByPrevId = async (prevId: string | null) => {

    return new Promise(async (resolve, reject) => {

        try {

            let navs = await Nav.find({
                prevId
            }).sort({order: 1});

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByPrevIdWithMaxOrders = async (prevId: string | null) => {

    return new Promise(async (resolve, reject) => {

        try {

            console.log(prevId);

            let navs = await Nav.aggregate([
                {
                    '$match': {
                        prevId: prevId ? ObjectId(prevId) : null
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'let': {
                            'prevId': '$_id'
                        },
                        'pipeline': [
                            {
                                '$match': {
                                    '$expr': {
                                        '$eq': [
                                            '$prevId', '$$prevId'
                                        ]
                                    }
                                }
                            }, {
                                '$group': {
                                    '_id': null,
                                    'maxOrder': {
                                        '$max': '$order'
                                    }
                                }
                            }
                        ],
                        'as': 'maxInnerOrder'
                    }
                }, {
                    '$unwind': {
                        'path': '$maxInnerOrder',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$addFields': {
                        'maxInnerOrder': {
                            '$cond': {
                                'if': '$maxInnerOrder',
                                'then': '$maxInnerOrder.maxOrder',
                                'else': 0
                            }
                        }
                    }
                }
            ]);

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getByOSPTAndByPrevId = async (prevId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let navs = await Nav.find({
                prevId
            });

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const getMaxOrderByPrevId = async (prevId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            prevId = prevId ? prevId : null;

            let navs = await Nav.find({
                prevId
            }).sort('-order').limit(1).select('-_id order');

            let maxOrder = navs[0] ? navs[0].order : 0;

            return resolve(maxOrder);

        } catch (err) {
            return reject(err);
        }

    });
};


const create = async ({prevId, nameKz, nameRu, order, coordinates}: NavProps) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let prevIdString = prevId ? prevId.toString() : null;

            order = await normalizeOrderCreate(order, prevIdString, session);

            let nav = new Nav({
                prevId,
                nameKz,
                nameRu,
                order,
                coordinates
            });

            await nav.save({session});

            await session.commitTransaction();
            session.endSession();

            return resolve(nav);

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            console.error(err);
            return reject(err);
        }

    });
};


const update = async (navId: string, {nameKz, nameRu, order, coordinates}: NavProps) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let nav = await Nav.findById(navId);

            let prevIdString = nav.prevId ? nav.prevId.toString() : null;

            order = await normalizeOrderUpdate(navId, order, prevIdString, session);

            nav = await Nav.findByIdAndUpdate(navId, {
                nameKz,
                nameRu,
                order,
                coordinates
            }, {new: true}).session(session);

            await nav.save({session});

            await session.commitTransaction();
            session.endSession();

            return resolve(nav);

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


// const deleteNav = async (navId: string) => {
//
//     return new Promise(async (resolve, reject) => {
//
//         const session = await mongoose.startSession();
//         session.startTransaction();
//
//         try {
//
//             let nav = await Nav.findById(navId);
//
//             if (nav.prevId) {
//
//             } else {
//
//             }
//
//
//             let navServiceProvidersCount = await ServiceProvider.find({
//                 navId
//             }).countDocuments();
//
//             if (navServiceProvidersCount == 0) {
//
//                 let nav = await Nav.findById(navId).session(session);
//
//                 let prevIdString = nav.prevId ? nav.prevId.toString() : null;
//
//                 await normalizeOrderDelete(nav._id, nav.order, prevIdString, session);
//
//                 let deletedServiceProvidersNavIds = await removeServiceProvidersNavIds(navId, session);
//
//                 let deletedNav = await Nav.deleteOne({
//                     _id: navId
//                 }).session(session);
//
//                 await session.commitTransaction();
//                 session.endSession();
//
//                 return resolve({idDeleted: true, deletedNav, deletedServiceProvidersNavIds});
//             } else {
//                 return resolve({isDeleted: false, count: navServiceProvidersCount})
//             }
//
//         } catch (err) {
//             await session.abortTransaction();
//             session.endSession();
//
//             return reject(err);
//         }
//
//     });
// };
//
//
// const deleteNavTransfer = async (navId: string, from: string, to: string) => {
//
//     const session = await mongoose.startSession();
//     session.startTransaction();
//
//     return new Promise(async (resolve, reject) => {
//
//         try {
//
//             let transferredServiceProviders = await transferServiceProviders(from, to, session);
//
//             let deletedNav = await Nav.deleteOne({
//                 _id: navId
//             }).session(session);
//
//             await session.commitTransaction();
//             session.endSession();
//
//             return resolve({deletedNav, transferredServiceProviders})
//
//         } catch (err) {
//             await session.abortTransaction();
//             session.endSession();
//
//             return reject(err);
//         }
//
//     });
// };
//
//
// const deleteNavSetNull = async (navId: string) => {
//
//     return new Promise(async (resolve, reject) => {
//
//         const session = await mongoose.startSession();
//         session.startTransaction();
//
//         try {
//
//             let deletedServiceProvidersNavIds = await removeServiceProvidersNavIds(navId, session);
//
//             let deletedNav = await Nav.deleteOne({
//                 _id: navId
//             }).session(session);
//
//             await session.commitTransaction();
//             session.endSession();
//
//             return resolve({deletedNav, deletedServiceProvidersNavIds})
//
//         } catch (err) {
//             await session.abortTransaction();
//             session.endSession();
//
//             return reject(err);
//         }
//
//     });
// };
//
//
// const transferServiceProviders = async (from: string, to: string, session: any) => {
//
//     return new Promise(async (resolve, reject) => {
//
//         try {
//
//             let serviceProviders = await ServiceProvider.updateMany({
//                 navId: from
//             }, {
//                 $set: {
//                     navId: to
//                 }
//             }).session(session);
//
//             return resolve(serviceProviders);
//
//         } catch (err) {
//             return reject(err);
//         }
//
//     });
// };
//
//
// const removeServiceProvidersNavIds = async (navId: string, session: any) => {
//
//     return new Promise(async (resolve, reject) => {
//
//         try {
//
//             let serviceProviders = await ServiceProvider.updateMany({
//                 navId: navId
//             }, {
//                 $set: {
//                     navId: null
//                 }
//             }).session(session);
//
//             return resolve(serviceProviders);
//
//         } catch (err) {
//             return reject(err);
//         }
//
//     });
// };


const connectArray = async (osptId: string, navs: any) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        console.log({osptId});
        console.log({navs});

        try {

            // console.log({users});

            let existingNavs = await NavOSPT.find({
                osptId
            }, '-_id navId', {session});

            console.log({existingNavs});

            let existingNavIds = existingNavs.map((nav) => {
                console.log(nav);
                return nav.navId.toString();
            });

            // console.log({existingNavIds});


            let existingNavsToDelete = existingNavIds.filter(item => {
                // console.log({item});
                // console.log(!navs.includes(item));
                return !navs.includes(item);
            });

            // console.log({existingNavsToDelete});


            let deletedOrganizationNavs = await NavOSPT.deleteMany({
                osptId,
                navId: {$in: [...existingNavsToDelete]}
            }).session(session);


            let navsToCreate = navs.filter((navId: string) => !existingNavIds.includes(navId));

            let navsArray = navsToCreate.map((navId: string) => {
                return {navId, osptId}
            });

            // console.log({navsArray});

            let newOrganizationNavs = await NavOSPT.insertMany(navsArray, {session});

            await session.commitTransaction();
            session.endSession();

            return resolve({
                deletedNavs: deletedOrganizationNavs,
                newNavs: newOrganizationNavs
            });

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const connect = async ({navId, osptId}: NavOSPTProps) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let addedNav = await NavOSPT.findOneAndUpdate({
                    osptId,
                    navId
                },
                {
                    $set: {
                        osptId,
                        navId,
                        suspended: false
                    }
                }, {new: true, upsert: true}).session(session);

            let nestedNavs = await Nav.find({
                prevId: navId
            }).session(session);

            let nestedNavIds = nestedNavs.map((item) => {
                return item._id
            });

            let addedNestedNavs = await NavOSPT.updateMany({
                navId: {$in: nestedNavIds}
            }, {
                $set: {
                    // navId,
                    osptId
                }
            }, {upsert: true}).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({addedNav, addedNestedNavs});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const removeConnection = async ({navId, osptId}: NavOSPTProps) => {

    const session = await mongoose.startSession();
    session.startTransaction();

    return new Promise(async (resolve, reject) => {

        try {

            let deletedNav = await NavOSPT.findOneAndDelete({
                osptId,
                navId
            }).session(session);

            let nestedNavs = await Nav.find({
                prevId: navId
            }).session(session);

            let nestedNavIds = nestedNavs.map((item) => {
                return item._id
            });

            let deletedNestedNavs = await NavOSPT.deleteMany({
                navId: {$in: nestedNavIds}
            }).session(session);

            await session.commitTransaction();
            session.endSession();

            return resolve({deletedNav, deletedNestedNavs});

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const normalizeOrderCreate = async (order: number, prevId: string, session: any) => {

    let maxOrder: any = await Nav.find({
        ...prevId ? {prevId} : {prevId: null},
    }).session(session).sort('-order').limit(1).select('-_id order');

    console.log(maxOrder);

    maxOrder = maxOrder.length ? maxOrder[0].order : 0;

    if (!order) {
        return maxOrder + 1;
    }

    if (maxOrder == 0) {
        return 1;
    }

    if (order > maxOrder + 1) {
        return maxOrder + 1;
    }

    await Nav.updateMany({
        ...prevId ? {prevId} : {prevId: null},
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


const normalizeOrderUpdate = async (id: string, order: number, prevId: string, session: any) => {

    let nav = await Nav.findById(id).session(session);

    if (!order || nav.order === order) {
        return nav.order;
    }

    let maxOrder: any = await Nav.find({
        ...prevId ? {prevId} : {prevId: null},
    }).session(session).sort('-order').limit(1).select('-_id order');

    maxOrder = maxOrder[0].order;

    if (order > maxOrder || order < 1) {
        throw Error('Invalid value for "order"')
    }

    if (nav.order < order) {

        await Nav.updateMany({
            ...prevId ? {prevId} : {prevId: null},
            $and: [
                {
                    order: {$lte: order}
                },
                {
                    order: {$gt: nav.order}
                },
            ]
        }, {
            $inc: {
                order: -1
            }
        }, {session});

    } else if (nav.order > order) {

        await Nav.updateMany({
            ...prevId ? {prevId} : {prevId: null},
            $and: [
                {
                    order: {$lt: nav.order}
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

    }

    return order;

};

const setNavs = async () => {

    return new Promise(async (resolve, reject) => {

        try {

            await NavOSPT.deleteMany({});

            const serviceProviders = await ServiceProvider.find();

            serviceProviders.map(async (provider, index) => {

                console.log(index);
                let osp = await OSP.findOne({serviceProviderId: provider._id});

                if (osp) {
                    let ospt = await OSPT.findOne({
                        organizationId: osp.organizationId,
                        serviceProviderTypeId: provider.serviceProviderTypeId
                    });

                    if (provider.navId) {
                        let raion = await Nav.findById(provider.navId);

                        let regionOsp = await NavOSPT.findOne({navId: raion.prevId});

                        if (!regionOsp) {
                            const newRegionOsp = new NavOSPT({
                                navId: raion.prevId,
                                osptId: ospt._id
                            });

                            await newRegionOsp.save()
                        }

                        let raionOsp = await NavOSPT.findOne({navId: raion._id});

                        if (!raionOsp) {
                            const newRaionOsp = new NavOSPT({
                                navId: raion._id,
                                osptId: ospt._id
                            });

                            await newRaionOsp.save()
                        }


                    }
                }

            });

            return resolve({success: true});

        } catch (err) {
            return reject(err);
        }

    });
};


// const normalizeOrderDelete = async (id: string, order: number, prevId: string, session: any) => {
//
//     await Nav.updateMany({
//         ...prevId ? {prevId} : {prevId: null},
//         order: {$gt: order},
//     }, {
//         $inc: {
//             order: -1
//         }
//     }, {session});
//
//     await Nav.findByIdAndUpdate(id, {
//         order: -1
//     }).session(session);
//
//     return order;
//
// };


export = {
    getAll,
    getAllWithNestings,
    getByPrevId,
    getByPrevIdWithMaxOrders,
    getByOspt,
    getByOsptAndByPrevId,
    getMaxOrderByPrevId,
    create,
    connect,
    connectArray,

    update,

    removeConnection,

    ...deleteActions,

    setNavs
}