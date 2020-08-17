export const PUBLIC_FOLDER:string = 'public/';

export const DESTINATIONS:any = {
    organization: 'uploads/organizations/',
    serviceProviderType: 'uploads/service-provider-types/',
    serviceCategory: 'uploads/categories/',
    serviceProvider: 'uploads/service-providers/',
    user: 'uploads/users/',
    reviews: 'uploads/reviews/'
};

export const DEFAULT_IMAGES:any = {
    organization: 'defaults/organization.jpg',
    serviceProviderType: 'defaults/service-provider-type.jpg',
    serviceCategory: 'defaults/service-category.jpg',
    serviceProvider: 'defaults/service-provider.png',
    user: 'defaults/user.png'
};

export const IMPORTATION_FOLDER = 'temp/';

export const NUMBER_OF_RESULTS_PER_PAGE:any = {
    organization: 20,
    serviceProviderType: 20,
    serviceName: 20,
    serviceCategory: 20,
    serviceCriteria: 20,
    serviceProvider: 20,
    admin: 20,
    reviews: 20,
    field: 20,
    history: 20
};

export const REVIEW_HISTORY_TYPES:any = {
    NEW: 0,
    ACTIVE: 1,
    PROCESSED: 2,
    CONFIRM_RESOLVED: 3,
    CONFIRM_NOT_RESOLVED: 4
};

export const TIME_INTERVALS = {
    WEEK: 0,
    MONTH: 1,
    YEAR: 2
};

export const emailConfig = {
    host: "smtp.sparkpostmail.com",
    port: 587,
    secure: false,
    // service: 'gmail',
    // auth: {
    //     user: 'digital.agent.mailer@gmail.com',
    //     pass: 've03082018'
    // }
    auth: {
        user: 'SMTP_Injection', // generated ethereal user
        pass: 'e95cf2ac94a9834e726a5268a79106fdd7ce2810' // generated ethereal password
    }
};

export const supportTeamEmail = {
    email: "neo@digitalagent.kz"
};

export const smsService = {
    url: 'http://kazinfoteh.org:9507/api?action=sendmessage&username=mdexpress&password=eWcFWz&',
    messagetype: 'SMS:TEXT',
    originator: 'INFO_KAZ'
};