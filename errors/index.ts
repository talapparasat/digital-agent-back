class ERROR {
	message: string;

	constructor(code: string) {
		this.message = code;
	}
}

export default ERROR;
export * from '@errors/auth';
export * from '@errors/relation';
export * from '@errors/profile';
export * from '@errors/users';
export * from '@errors/verification';
export * from '@errors/nav';
export * from '@errors/field';