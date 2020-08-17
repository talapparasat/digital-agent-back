import User, { decodeJWT } from '@db/User';
import UserRole from '@db/User-role';
import {ROLES} from "@db/Role";

const authenticate = async (req: any, res: any, next: any) => {
	const { authorization } = req.headers;

	if (!authorization) {
		req.user = undefined;
		return next();
	}

	console.log('authenticate');

	try {
		const decodedJWT: any = decodeJWT(authorization);

		req.user = await User.findById({_id: decodedJWT._id});

		if (req.user && req.user._id) {
			let roles:any = await UserRole.find({
				userId: req.user._id
			}).populate('roleId', 'name');

			req.user.roles = roles.map((role : any) => role.roleId.name) || [];
		}

	} catch(err) {
		req.user = undefined;
	}

	next();
};

export default authenticate;
