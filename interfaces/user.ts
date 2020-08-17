export interface IUser {
    name: string,
    email: string,
    image: string
    phone: any;
    register_date: string;
    hash: string;
    salt: string;
    token: string;
}
