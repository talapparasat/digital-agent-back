import express from 'express';
import apiRouter from './api';
import * as path from "path";

const router = express.Router();

router.use('/api', apiRouter);
router.use(express.static('public'));
router.use(express.static('default'));

export default router;
