const requestTime = (req: any, res: any, next: any) => {
	req.requestTime = Date.now();
	next();
};

export default requestTime;


