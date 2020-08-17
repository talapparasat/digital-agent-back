import express from 'express';
import multer from "multer";

import serviceProviderTypeController from '@controllers/service-provider-type';
import Role from "@db/Role";
import UserRole from "@db/User-role";

import {
    superAdminRoleValidator,
    createDataValidator,
    updateDataValidator,
    suspendDataValidator,
    isOrganizationNotRelatedToServiceProviderTypeYet,
    isOrganizationRelatedToServiceProviderType
} from './validators';

import { pagination, uploadFile, updateFile } from './middleware'

const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.get('/autocomplete', async (req: any, res: any) => {

    try {
        const serviceProviderTypes = await serviceProviderTypeController.get({});

        res.status(200).send(serviceProviderTypes);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/', pagination, async (req: any, res: any) => {

    try {

        let query = req.query['query'];
        let page = req.query['page'];

        const serviceProviderTypes = await serviceProviderTypeController.getByPage(query, page);

        res.status(200).send(serviceProviderTypes);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.get('/1', pagination, async (req: any, res: any) => {

    try {

        const superAdmin = await new Role({
            name: "superadmin"
        }).save();

        const admin = await new Role({
            name: "admin"
        }).save();

        let user = await new UserRole({
            userId: "5dd4202964774c00444fd6d2",
            roleId: superAdmin._id
        }).save();

        res.send(user)

    } catch (err) {
        res.status(400).send(err);
    }

});


//API для мобилки. Получать список организаций определенного типа услугодателя
router.get('/:serviceProviderTypeId/organizations', async (req: any, res: any) => {

    try {

        let {serviceProviderTypeId} = req.params;

        const organizations = await serviceProviderTypeController.getOrganizationsOfServiceProvider(serviceProviderTypeId);

        res.status(200).send(organizations);

    } catch (err) {
        res.status(400).send(err);
    }

});


// API для главной страницы мобильного приложения. Возвращает все не suspended типы услугодателей, количество организации
// которое включает этот тип услугодателя, и общее количество услугодателей на системе
router.get('/all', async (req: any, res: any) => {

    try {
        const serviceProviderTypes = await serviceProviderTypeController.getAllWithServicesCountAndOrgCount();

        res.status(200).send(serviceProviderTypes);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.post('/', multerUpload.single('image'), uploadFile, superAdminRoleValidator, ...createDataValidator, async (req: any, res: any) => {

    try {

        const serviceProviderType = await serviceProviderTypeController.create({
            nameKz: req.body.nameKz,
            nameRu: req.body.nameRu,
            image: req.body.image,
            order: req.body.order,
            isGovernment: req.body.isGovernment
        });

        res.status(200).send(serviceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderTypeId', multerUpload.single('image'), updateFile, superAdminRoleValidator, ...updateDataValidator, async (req: any, res: any) => {

    try {

        const {nameKz, nameRu, image, order, isGovernment, isActive} = req.body;
        const {serviceProviderTypeId} = req.params;

        const updatedServiceProviderType = await serviceProviderTypeController.update(serviceProviderTypeId, {
            nameKz,
            nameRu,
            image,
            order,
            isGovernment,
            isActive
        });

        res.status(200).send(updatedServiceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderTypeId/activate', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        const serviceProviderType = await serviceProviderTypeController.activateDeactivate(req.params.serviceProviderTypeId, true);

        res.status(200).send(serviceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderTypeId/deactivate', superAdminRoleValidator, async (req: any, res: any) => {

    try {

        const serviceProviderType = await serviceProviderTypeController.activateDeactivate(req.params.serviceProviderTypeId, false);

        res.status(200).send(serviceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});


router.put('/:serviceProviderTypeId/suspend', superAdminRoleValidator, ...suspendDataValidator, async (req: any, res: any) => {

    try {

        const suspendedServiceProviderType = await serviceProviderTypeController.suspend(req.params.serviceProviderTypeId);

        res.status(200).send(suspendedServiceProviderType);

    } catch (err) {
        res.status(400).send(err);
    }

});

export default router;
