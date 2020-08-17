import OperatorServiceProvider from '@db/Operator_Service-provider'
import Organization from '@db/Organization'
import OrganizationServiceProvider from '@db/Organization_Service-provider'
import OrganizationServiceProviderType from '@db/Organization_Service-provider-type'
import OSPT_SC_SC from '@db/OSPT_SC_SC'
import OSPTServiceCategory from '@db/OSPT_Service-category'
import OSPTServiceName from '@db/OSPT_Service-name'
import Role, {ROLES} from '@db/Role'
import ServiceCategory from '@db/Service-category'
import ServiceCriteria from '@db/Service-criteria'
import ServiceName from '@db/Service-name'
import ServiceProvider from '@db/Service-provider'
import ServiceProviderType from '@db/Service-provider-type'
import SupervisorServiceProvider from '@db/Supervisor_Service-provider'
import User from '@db/User'
import UserOrganization from '@db/User-organization'
import UserPosition from '@db/User-position'
import UserRole from '@db/User-role'
import Review from '@db/Review'
import Notification from '@db/Notification'
import Nav from '@db/Nav'
import NavOSPT from '@db/Nav_OSPT'
import Field from '@db/Field'
import ReviewHistory from '@db/ReviewHistory'
import Review_Field from '@db/Review_Field'


const initSchemas = () => {
    try {
        // OperatorServiceProvider.createCollection();
        // Organization.createCollection();
        // OrganizationServiceProvider.createCollection();
        // OrganizationServiceProviderType.createCollection();
        // OSPT_SC_SC.createCollection();
        // OSPTServiceCategory.createCollection();
        // OSPTServiceCategory.createCollection();
        // OSPTServiceName.createCollection();
        // Role.createCollection();
        //
        // ServiceCategory.createCollection();
        // ServiceCategory.createIndexes();
        //
        // ServiceCriteria.createCollection();
        // ServiceCriteria.createIndexes();
        //
        // ServiceName.createCollection();
        // ServiceName.createIndexes();
        //
        // ServiceProvider.createCollection();
        // ServiceProviderType.createCollection();
        // SupervisorServiceProvider.createCollection();
        // User.createCollection();
        User.ensureIndexes()
        // UserOrganization.createCollection();
        // UserPosition.createCollection();
        // UserRole.createCollection();
        // Review.createCollection();
        // Notification.createCollection();
        // Nav.createCollection();
        // NavOSPT.createCollection();
        // Field.createCollection();
        // ReviewHistory.createCollection()
        Review_Field.createCollection()

    }catch (err) {
        console.log("Error while creating collections");
        console.log(err);
    }

};


const initRoles = () => {
    try {
        Object.keys(ROLES).map((key: string) => {
            Role.updateOne({
                name: ROLES[key]
            }, {
                $set: {
                    name: ROLES[key]
                }
            },{new: true})
        })
    } catch (err) {
        console.log(err)
    }

};

export = {
    initSchemas,
    initRoles
}