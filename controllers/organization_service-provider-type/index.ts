import OrganizationServiceProviderType, {OrganizationServiceProviderTypeProps} from '@db/Organization_Service-provider-type';
import ServiceProviderType, {ServiceProviderTypeProps} from '@db/Service-provider-type';

const get = async (findRequestData: any) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organizationsServiceProviderTypes = await OrganizationServiceProviderType.find({...findRequestData});

            return resolve(organizationsServiceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};


const create = async (organizationId: string, serviceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOrganizationServiceProviderType = new OrganizationServiceProviderType({
                organizationId,
                serviceProviderTypeId,
            });

            newOrganizationServiceProviderType = await newOrganizationServiceProviderType.save();

            return resolve(newOrganizationServiceProviderType);

        } catch (err) {
            return reject(err);
        }

    });

};


const createWithType = async ({ nameKz, nameRu }: ServiceProviderTypeProps, { organizationId }: OrganizationServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newServiceProvider = new ServiceProviderType({
                nameKz,
                nameRu
            });

            newServiceProvider = await newServiceProvider.save();

            let newOrganizationServiceProviderType = new OrganizationServiceProviderType({
                organizationId,
                serviceProviderTypeId: newServiceProvider._id,
            });

            newOrganizationServiceProviderType = await newOrganizationServiceProviderType.save();

            return resolve({newServiceProvider, newOrganizationServiceProviderType});

        } catch (err) {
            return reject(err);
        }

    })

};


const put = async (organizationsServiceProviderTypeId: string, {organizationId, serviceProviderTypeId}: OrganizationServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organizationsServiceProviderTypes = await OrganizationServiceProviderType.updateOne({
                _id: organizationsServiceProviderTypeId,
            }, {
                $set: {
                    organizationId: organizationId,
                    serviceProviderTypeId: serviceProviderTypeId,
                }
            });

            return resolve(organizationsServiceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};


const del = async (organizationsServiceProviderTypeId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let deletedOrganizationsServiceProviderTypes = await OrganizationServiceProviderType.findByIdAndDelete(
                organizationsServiceProviderTypeId
            );

            return resolve(deletedOrganizationsServiceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};

const delWithName = async ({organizationId, serviceProviderTypeId}: OrganizationServiceProviderTypeProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let deletedOrganizationsServiceProviderTypes = await OrganizationServiceProviderType.findOneAndDelete(
                {
                    organizationId,
                    serviceProviderTypeId
                }
            );

            return resolve(deletedOrganizationsServiceProviderTypes);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    get,
    create,
    createWithType,
    put,
    del,
    delWithName
};