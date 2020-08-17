import express from 'express';

import apiAuth from './auth';
import apiProfile from './profile';
import apiServiceProviderTypes from './service-provider-types';
import apiOrganizations from './organizations';
import apiServiceNames from './service-name';
import apiServiceCategories from './service-categories';
import apiServiceCriterias from './service-criterias';
import apiServiceProviders from './service-providers';
import apiUsers from './users';
import apiReviews from './reviews';
import apiNotifications from './notifications';
import apiNavs from './navs';
import apiFields from './fields';
import apiSurvey from './survey';
import apiVerification from './verification';
import apiSupport from './support';
import apiAdmin from './admin';
import apiStatistics from './statistics';
import apiAnalytics from './analytics';
import apiImportation from './importation';
import apiExportation from './exportation';

import apiOrganizationServiceProviderTypes from './organization.service-provider-types';
import apiOrganizationServices from './organization.services'
import apiOrganizationCategories from './organization.categories'
import apiOrganizationCriterias from './organization.criterias'
import apiOrganizationServiceProviders from './organization.service-providers'
import apiOrganizationsUsers from './organizations.users';
import apiOrganizationFields from './organization.fields';

import apiServiceProviderUsers from './service-provider.users';


import isAuth from "@mw/validators/isAuth";

const router = express.Router();

router.use('/auth', apiAuth);
router.use('/profile', isAuth, apiProfile);
router.use('/service-provider-types', apiServiceProviderTypes);
router.use('/organizations', isAuth, apiOrganizations);
// router.use('/organization-service-provider-types', isAuth, apiOrganizationServiceProviderTypes);
router.use('/service-providers', apiServiceProviders);
router.use('/service-names', isAuth, apiServiceNames);
router.use('/service-categories', isAuth, apiServiceCategories);
router.use('/service-criterias', isAuth, apiServiceCriterias);
router.use('/users', isAuth, apiUsers);
router.use('/reviews', apiReviews);
router.use('/notifications', apiNotifications);
router.use('/navs', apiNavs);
router.use('/fields', apiFields);
router.use('/survey', apiSurvey);
router.use('/verification', apiVerification);
router.use('/support', apiSupport);
router.use('/admin', isAuth, apiAdmin);
router.use('/statistics', isAuth, apiStatistics);
router.use('/analytics', isAuth, apiAnalytics);
router.use('/import', isAuth, apiImportation);
router.use('/export', isAuth, apiExportation);

router.use('/organizations/:organizationId/spt', isAuth, apiOrganizationServiceProviderTypes);
router.use('/organizations/:organizationId/users', isAuth, apiOrganizationsUsers);
router.use('/organizations/:organizationId/services', isAuth, apiOrganizationServices);
router.use('/organizations/:organizationId/categories', isAuth, apiOrganizationCategories);
router.use('/organizations/:organizationId/criterias', isAuth, apiOrganizationCriterias);
router.use('/organizations/:organizationId/service-providers', isAuth, apiOrganizationServiceProviders);
router.use('/organizations/:organizationId/fields', isAuth, apiOrganizationFields);

router.use('/service-providers/:serviceProviderId/users', isAuth, apiServiceProviderUsers);

export default router;
