import ServiceProvider from "@db/Service-provider";
import Nav from "@db/Nav";
import mongoose, {set} from "mongoose";

const deleteNav = async (navId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let nav = await Nav.findById(navId);

            let result: any;

            if(nav.prevId) {
                result = await handleRaionDelete(navId);
            } else  {
                result = await handleRegionDelete(navId);
            }

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const deleteNavConfirm = async (navId: string, setNull:boolean, to:string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let nav = await Nav.findById(navId);

            let result: any;

            if(nav.prevId) {
                result = await handleRaionDeleteConfirm(navId, setNull, to);
            } else  {
                result = await handleRegionDeleteConfirm(navId, setNull, to);
            }

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const handleRegionDelete = async (navId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let topServiceProvidersCount = await ServiceProvider.find({
                navId
            }).countDocuments();

            let nestedNavs = await Nav.find({
                prevId: navId
            });

            let nestedNavsIds = nestedNavs.map((nav) => {
                return nav._id
            });

            let innerServiceProvidersCount = await ServiceProvider.find({
                navId: {$in: nestedNavsIds}
            }).countDocuments();

            let totalCount = topServiceProvidersCount + innerServiceProvidersCount;

            let result: any = {};

            if (totalCount == 0 && nestedNavs.length == 0) {
                await normalizeOrderDelete(navId, session);

                result.deletedNestedNavs = await Nav.deleteMany({
                    prevId: navId
                }).session(session);

                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session);

                result.isDeleted = true;

            } else {
                result = {
                    isDeleted: false,
                    serviceProvidersCount: totalCount,
                    navsCount: nestedNavs.length
                }
            }

            await session.commitTransaction();
            session.endSession();

            return resolve(result)

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const handleRegionDeleteConfirm = async (navId: string, setNull: boolean, to: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let result: any = {};

            await normalizeOrderDelete(navId, session);

            if (setNull) {

                result.updatedServiceProviders = await removeRegionServiceProvidersNavIds(navId, session);

                result.deletedNestedNavs = await Nav.deleteMany({
                    prevId: navId
                }).session(session);

                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session)

            } else {
                result.transferredRaoins = await transferRaoins(navId, to, session);

                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session);
            }

            await session.commitTransaction();
            session.endSession();

            return resolve(result)

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const handleRaionDelete = async (navId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let result:any = {};

            console.log("Is deleted");

            let navServiceProvidersCount = await ServiceProvider.find({
                navId
            }).countDocuments().session(session);

            if (navServiceProvidersCount == 0) {
                await normalizeOrderDelete(navId, session);

                // await session.commitTransaction();
                // session.endSession();

                // let deletedNav = await Nav.findByIdAndDelete(navId).session(session);

                // return resolve({isDeleted: true, deletedNav})

                result.isDeleted = true;
                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session);

            } else {

                result.isDeleted = false;
                result.serviceProvidersCount = navServiceProvidersCount;

            }

            await session.commitTransaction();
            session.endSession();

            return resolve(result);

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const handleRaionDeleteConfirm = async (navId: string, setNull: boolean, to: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let result: any = {};

            await normalizeOrderDelete(navId, session);

            if (setNull) {

                result.updatedServiceProviders = await removeRaionServiceProvidersNavIds(navId, session);

                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session)

            } else {
                result.transferredServiceProviders = await transferServiceProviders(navId, to, session);

                result.deletedNav = await Nav.findByIdAndDelete(navId).session(session);
            }

            await session.commitTransaction();
            session.endSession();

            return resolve(result)

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });
};


const transferServiceProviders = async (from: string, to: string, session: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviders = await ServiceProvider.updateMany({
                navId: from
            }, {
                $set: {
                    navId: to
                }
            }).session(session);

            return resolve(serviceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


//Transfer raions from one region to another
const transferRaoins = async (from: string, to: string, session: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let navs = await Nav.updateMany({
                prevId: from
            }, {
                $set: {
                    prevId: to
                }
            }).session(session);

            return resolve(navs);

        } catch (err) {
            return reject(err);
        }

    });
};


const removeRaionServiceProvidersNavIds = async (navId: string, session: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let serviceProviders = await ServiceProvider.updateMany({
                navId: navId
            }, {
                $set: {
                    navId: null
                }
            }).session(session);

            return resolve(serviceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const removeRegionServiceProvidersNavIds = async (navId: any, session: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let nestedNavs = await Nav.find({
                prevId: navId
            });

            let netedNavsIds = nestedNavs.map((nav) => {
                return nav._id;
            });

            let serviceProviders = await ServiceProvider.updateMany({
                navId: {
                    $in: netedNavsIds
                }
            }, {
                $set: {
                    navId: null
                }
            }).session(session);

            return resolve(serviceProviders);

        } catch (err) {
            return reject(err);
        }

    });
};


const normalizeOrderDelete = async (id: string, session: any) => {

    let nav = await Nav.findById(id);

    let order = nav.order;
    let prevId = nav.prevId;

    await Nav.updateMany({
        ...prevId ? {prevId} : {prevId: null},
        order: {$gt: order},
    }, {
        $inc: {
            order: -1
        }
    }, {session});

    await Nav.findByIdAndUpdate(id, {
        order: -1
    }).session(session);

    return order;

};

export = {
    deleteNav,
    deleteNavConfirm
}
