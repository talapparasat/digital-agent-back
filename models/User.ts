import { Schema, model, Document }  from 'mongoose';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';

import Organization, {OrganizationProps} from '@db/Organization';
import UserRole from '@db/User-role';
import UserOrganization from '@db/User-organization';
import Operator_ServiceProvider from '@db/Operator_Service-provider';
import {ServiceProviderProps} from '@db/Service-provider'

import { IUser } from "@interfaces/user";

export interface IUserModel extends IUser, Document {
	setPassword(p: string): void;
	validatePassword(p: string): boolean;
	generateJWT(): string;
	toAuthJSON(): {
		_id: string,
		token: string
	};
	getRole(): string|null,
	getOrganization(): any|null,
	getServiceProvider(): ServiceProviderProps|null
}

const UserSchema: Schema = new Schema({
	name: {
		type: String,
	},
	email: {
		type: String,
		trim: true,
		index: true,
		unique: true,
		sparse: true
	},
	phone: {
		work: {
			type: String
		},
		inner: {
			type: String
		},
		mobile: [{
			type: String
		}]
	},
	image: {
		type: String,
	},
	register_date: {
		type: Date,
		default: Date.now
	},
	isVerified: {
		type: Boolean,
		default: false
	},
	isPhoneVerified: {
		type: Boolean,
		default: false
	},
	hash: String,
	salt: String,
	token: String,
	webTokens: [String],
	lastReviewTime: Date,
	suspended: {
		type: Object,
		default: false
	}
});

UserSchema.methods.setPassword = function(password: string) {
	this.salt = crypto.randomBytes(16).toString('hex');
	this.hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
};

UserSchema.methods.validatePassword = function(password: string) {
	const hash = crypto.pbkdf2Sync(password, this.salt, 10000, 512, 'sha512').toString('hex');
	return this.hash === hash;
};

UserSchema.methods.generateJWT = function() {
	const expirationDate = new Date();
	expirationDate.setDate(expirationDate.getDate() + 60);

	// @ts-ignore
	const expirationTime =  parseInt(expirationDate.getTime() / 1000, 10);

	return jwt.sign({
		_id: this._id,
		exp: expirationTime,
	}, 's6tRHe73');
};

UserSchema.methods.toAuthJSON = function() {
	return {
		_id: this._id,
		token: this.generateJWT(),
	};
};

UserSchema.methods.getRole = async function() {
	let userRole = await UserRole.findOne({
		userId: this._id
	}).populateTs('roleId');

	let role = userRole?userRole.roleId['name']:'user';

	return role;
};

UserSchema.methods.getOrganization = async function() {
	let userOrganization = await UserOrganization.findOne({
		userId: this._id
	}).populateTs('organizationId');

	let organization:any = userOrganization?userOrganization.organizationId:null;

	return organization;
};


UserSchema.methods.getServiceProvider = async function() {
	let operatorServiceProvider = await Operator_ServiceProvider.findOne({
		userId: this._id
	}).populateTs('serviceProviderId');

	let serviceProvider:any = operatorServiceProvider?operatorServiceProvider.serviceProviderId:null;

	return serviceProvider;
};

export function decodeJWT (token: string) {
	return jwt.verify(token, 's6tRHe73');
}

export default model<IUserModel>("User", UserSchema);
