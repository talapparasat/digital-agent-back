import express from 'express';
import multer from "multer";

import serviceProviderController from '@controllers/service-provider';

import {
    createDataValidator,
    createRoleValidator,
    updateDataValidator,
    updateRoleValidator,
    connectDataValidator,
    connectRoleValidator,
    autocompleteDataValidator,
    adminSuperAdminRoleValidator,
    getServiceProvidersRoleValidator,
    approveDataValidator,
    superAdminRoleValidator,
    searchDataValidator

} from "./validators";

import {
    uploadFile,
    updateFile,
    selectAdminOrganization,
    selectUserOrganization,
    setApprovedState,
    pagination,
    parseWorkHours
} from './middleware';
import {ROLES} from "@db/Role";

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.get('/', getServiceProvidersRoleValidator, selectUserOrganization, pagination, async (req: any, res: any) => {
    try {

        let { organizationId } = req.body;
        let query = req.query['query'];
        let page = req.query['page'];

        let serviceProviders:any;

        if (req.user.roles.includes(ROLES.SUPER_ADMIN) || req.user.roles.includes(ROLES.ADMIN)) {
            serviceProviders = await serviceProviderController.get(query, page);
        } else if(req.user.roles.includes(ROLES.SUPERVISOR)) {
            serviceProviders = await serviceProviderController.getForSupervisor(req.user._id, query, page);
        }

        res.status(200).send(serviceProviders);
    } catch (err) {
        res.status(400);
    }
});


// API для мобилки. Получать список услугодателей по определенному типу услугодателяПолучать список услугодателей
// по определенному типу услугодателя
router.get('/by-spt/:serviceProviderTypeId', pagination, async (req: any, res: any) => {
    try {

        let page = req.query['page'];
        let query = req.query['query'];
        let lang = req.query['lang'] && (req.query['lang'] == 'kz' || req.query['lang'] == 'ru')?req.query['lang']: 'ru';

        let {serviceProviderTypeId} = req.params;

        let serviceProviders = await serviceProviderController.getByServiceProviderTypeId(page, query, lang, serviceProviderTypeId);

        res.status(200).send(serviceProviders);
    } catch (err) {
        res.status(400);
    }
});



router.get('/autocomplete', adminSuperAdminRoleValidator, selectUserOrganization,  async (req: any, res: any) => {
    try {

        let query = req.query['query'] ? req.query['query'] : '';
        let {organizationId} = req.body;

        console.log({query, organizationId});

        const serviceProviders = await serviceProviderController.autocomplete(query, organizationId);

        res.status(200).send(serviceProviders);
    } catch (err) {
        res.status(400);
    }
});


router.get('/search', ...searchDataValidator, pagination, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        let serviceProviderTypeId = req.query['serviceProviderTypeId'];

        const serviceProviders = await serviceProviderController.search(serviceProviderTypeId, query, page);

        res.status(200).send(serviceProviders);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});

// API для мобилки. Получать категорий, критерий и услуги вместе с информацией услугодателя.
router.get('/mobile/:serviceProviderId', async (req: any, res: any) => {
    try {

        console.log("edaed");

        let { serviceProviderId } = req.params;

        const serviceProvider = await serviceProviderController.getByIdWithAdditionalInfo(serviceProviderId);

        res.status(200).send(serviceProvider);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.get('/:serviceProviderId', adminSuperAdminRoleValidator, async (req: any, res: any) => {
    try {

        let { serviceProviderId } = req.params;

        const serviceProvider = await serviceProviderController.getById(serviceProviderId);

        res.status(200).send(serviceProvider);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.get('/:serviceProviderId/confirm', adminSuperAdminRoleValidator, async (req: any, res: any) => {
    try {

        let { serviceProviderId } = req.params;

        const serviceProviders = await serviceProviderController.confirm(serviceProviderId);

        res.status(200).send(serviceProviders);

    } catch (err) {
        res.status(400).send(err);
    }
});


router.post('/', multerUpload.single('image'), createRoleValidator, uploadFile, ...createDataValidator, parseWorkHours, setApprovedState, async (req: any, res: any) => {

    try {

        console.log(req.body.coordinates);


        console.log(req.body.workHours);

        const serviceProvider = await serviceProviderController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            info: req.body.info,
            address: req.body.address,
            image: req.body.image,
            coordinates: JSON.parse(req.body.coordinates),
            workHours: req.body.workHours,
        }, req.body.approved);

        res.status(200).send(serviceProvider);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/:serviceProviderId/connect', connectRoleValidator, ...connectDataValidator, selectAdminOrganization, async (req: any, res: any) => {

    try {

        let { organizationId, supervisorId, serviceProviderTypeId, navId } = req.body;
        let { serviceProviderId } = req.params;

        let serviceProvider = await serviceProviderController.connectToOrganizationAndSupervisorAndNav(organizationId, supervisorId, serviceProviderTypeId, serviceProviderId, navId);

        res.status(200).send(serviceProvider);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderId', multerUpload.single('image'), updateFile,
    updateRoleValidator, parseWorkHours, ...updateDataValidator, async (req: any, res: any) => {

    try {

        console.log(req.body.coordinates);

        const updatedServiceProvider = await serviceProviderController.update(req.params.serviceProviderId, {
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            info: req.body.info,
            address: req.body.address,
            image: req.body.image,
            coordinates: JSON.parse(req.body.coordinates),
            workHours: req.body.workHours,
        });

        res.status(200).send(updatedServiceProvider);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderId/approve', ...approveDataValidator, superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {serviceProviderId} = req.params;

        const approvedServiceProvider = await serviceProviderController.approve(serviceProviderId);

        res.status(200).send(approvedServiceProvider);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderId/suspend', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        let {serviceProviderId} = req.params;

        const approvedServiceProvider = await serviceProviderController.suspend(serviceProviderId);

        res.status(200).send(approvedServiceProvider);

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});


export default router;