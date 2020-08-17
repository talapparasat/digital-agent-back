import Review from "@db/Review";
import S_SP from "@db/Supervisor_Service-provider";
import O_SP from "@db/Organization_Service-provider";

let io = require('socket.io')();
const socketioAuth = require('socketio-auth');
import User, {decodeJWT} from '@db/User';
import {ROLES} from "@db/Role";
import bus from "@modules/bus";
import firebase from "@firebase"
import {NotificationProps} from "@db/Notification";
import Notification from "@db/Notification";
import {TEXTS, TYPES} from "@config/notifications";
import {REVIEW_HISTORY_TYPES} from "@config";


const socketStartUp = function (server: any) {
    console.log('Initializing socket...');
    io.attach(server);
};


socketioAuth(io, {
    authenticate: async function (socket: any, data: any, callback: any) {
        try {
            console.log('Authenticating User...');

            socket.client.userInfo = {};
            socket.client.userInfo.rooms = [];

            if (data.token) {
                let token = data.token;

                const decodedJWT: any = decodeJWT(token);

                let user = await User.findById({_id: decodedJWT._id});

                if (user && user._id) {

                    socket.client.userInfo.user = user;

                    socket.nickname = user.name;

                    if (await user.getRole() === ROLES.OPERATOR) {

                        let serviceProvider: any = await user.getServiceProvider();

                        socket.client.userInfo.role = ROLES.OPERATOR;

                        socket.join(serviceProvider._id, () => {
                            socket.client.userInfo.rooms.push(serviceProvider._id)
                        });

                    } else if(await user.getRole() === ROLES.SUPERVISOR) {

                        socket.client.userInfo.role = ROLES.SUPERVISOR;

                    } else {

                        socket.client.userInfo.role = ROLES.USER;
                        socket.client.userInfo.authenticated = true;

                    }

                    socket.join(user._id, () => {
                        socket.client.userInfo.rooms.push(user._id)
                    });

                    // io.of('/').in(user.email).clients((err:any, clients:any) => {
                    //     console.log(clients) // an array of socket ids
                    // });

                    return callback(null, true);

                } else {
                    return callback(new Error('User not found'));
                }

            } else if (data.phone) {

                socket.client.userInfo.phone = data.phone;

                socket.join(data.phone, () => {
                    socket.client.userInfo.rooms.push(data.phone)
                });

                return callback(null, true);

            } else {
                return callback(new Error('Token or phone number must be provided'));
            }
        } catch (err) {
            console.log(err);
            return callback(new Error('Invalid Token'));
        }

    },

    disconnect: (socket:any) => {
        if(socket.client.userInfo && socket.client.userInfo.user) {
            console.log(socket.client.userInfo.user.email + ' disconnected');
        } else if(socket.client.userInfo) {
            console.log(socket.client.userInfo.phone + ' disconnected');
        } else {
            console.log(socket.id + ' disconnected');
        }

        socket.emit('disconnected', 'You are disconnected. Try connecting again')
    },

    // postAuthenticate: (socket:any, data:any) => {
    //
    // },

    timeout: 60000
});


io.on('connection', function (socket: any) {
    console.log("New user connected");
    socket.client.connectedAt = Date.now();

    socket.on("send email", async function (data: any) {

        if(!socket.auth) {
            socket.emit('Authentication required')
        }

        if(socket.client.userInfo.role !== ROLES.OPERATOR) {
            socket.emit('Permission required')
        }

        if(!data.reviewId) {
            socket.emit("Review Id cannot be empty");
            return;
        }

        let reviewId = data.reviewId;

        let review = await Review.findById(reviewId);

        if(review.rate < 4) {
            socket.emit("Not allowed", "Cannot send email to the review with rate less than 4");
            return;
        }

        if(!review.operatorId.equals(socket.client.userInfo.user._id)) {
            socket.emit("Not allowed", "Cannot send email to this review");
            return;
        }

        if(!data.text) {
            socket.emit("Bad request", "Email body cannot be empty");
            return;
        }

        let userRoom:string;

        if (review.userId) {
            userRoom = String(review.userId);
            console.log(typeof userRoom)
        } else if (review.phone) {
            userRoom = review.phone
        }

        let userEmail:string;
        if(review.userId) {
            let user = await User.findById(review.userId);
            userEmail = user.email;
        } else {
            userEmail = review.email;
        }

        bus.emit('event.review.email.sent', {
            to: userEmail,
            text: data.text.length >= 15 ? data.text.substr(0, 15):data.text,
            review,
            fromSocket: socket.id,
            toSocket: userRoom
        });

        // io.to(userRoom).emit('email received', 'Email have been received for your review. Check your email');
        // socket.emit('email sent');

    });

    socket.on("send confirmation", async function (data: any) {
        try {

            console.log('send confirmation');

            if(!socket.auth) {
                socket.emit('Authentication required')
            }

            if(socket.client.userInfo.role !== ROLES.OPERATOR) {
                socket.emit('Permission required')
            }

            if(!data.reviewId) {
                socket.emit("Review Id cannot be empty");
                return;
            }

            let reviewId = data.reviewId;

            let review = await Review.findById(reviewId);

            if(!review.operatorId.equals(socket.client.userInfo.user._id)) {
                socket.emit("Not allowed", "Cannot send confirmation to this review");
                return;
            }

            let userRoom:string;

            if (review.userId) {
                userRoom = String(review.userId);
                console.log(typeof userRoom)
            } else if (review.phone) {
                userRoom = review.phone
            }

            const user = await User.findById(userRoom);

            io.to(userRoom).emit('confirmation received',
                {
                    _id: reviewId,
                    text: review.text,
                    ticketNumber: review.ticketNumber,
                    rate: review.rate
                });

            let notification = await createNotification({
                title: TEXTS.CONFIRMATION_RECEIVED.title,
                body: TEXTS.CONFIRMATION_RECEIVED.body,
                type: TYPES.REVIEW,
                to: userRoom,
                sourceId: review._id
            });

            // firebase.sendNotification(
            //     notification.title,
            //     notification.body,
            //     notification.type,
            //     user.token,
            //     notification.sourceId
            // );

            // bus.emit('event.mobile.email.received', {
            //     text: 'Получен потверждение на жалобу',
            //     type: 'review',
            //     to: userRoom,
            //     sourceId: reviewId
            // });

            socket.emit('confirmation sent');
            console.log('confirmation sent');

        } catch (e) {
            console.log("Error send confirmation");
            console.log(e);
        }

    });


    socket.on("cancel review", async function (data: any) {

        if(!socket.auth) {
            socket.emit('Authentication required')
        }

        if(socket.client.userInfo.role !== ROLES.USER) {
            socket.emit('Permission required')
        }

        if(!data.reviewId) {
            socket.emit("ReviewId must be provided");
            return;
        }

        let reviewId = data.reviewId;

        let review = await Review.findById(reviewId);

        if(review.status == 5 || review.status == 6) {
            socket.emit("cannot cancel", "Cannot cancel this review");
            return;
        }

        let updatedReview = await Review.findByIdAndUpdate(reviewId, {
            status: 6
        }, {new: true});

        io.to(review.operatorId).emit("Review.cancelled", {review: updatedReview});

        if(review.status == 2) {
            let supervisorId = await getSupervisorIdOfServiceProvider(review.serviceProviderId);
            io.to(supervisorId).emit('Review.cancelled', {review: updatedReview});
        }

        socket.emit('Review.cancelled', "Review has been cancelled");

    });


    socket.on("send not called", async function (data: any) {

        if(!socket.auth) {
            socket.emit('Authentication required')
        }

        if(socket.client.userInfo.role !== ROLES.USER) {
            socket.emit('Permission required')
        }

        if(!data.reviewId) {
            socket.emit("ReviewId must be provided");
            return;
        }

        let reviewId = data.reviewId;

        let review = await Review.findByIdAndUpdate(reviewId, {
            status: 2
        }, {new: true});

        let organization_ServiceProvider = await O_SP.findOne({
            serviceProviderId: review.serviceProviderId
        }).populateTs('organizationId');

        let organization:any = organization_ServiceProvider.organizationId;


        let supervisorId = await getSupervisorIdOfServiceProvider(review.serviceProviderId);

        io.to(supervisorId).emit('not called', {review});

        bus.emit('event.mobile.email.received', {
            text: 'Получен не звонили',
            type: 'not called',
            to: supervisorId,
            sourceId: reviewId
        });

        let notification = await createNotification({
            title: TEXTS.NOT_CALLED.title,
            body: TEXTS.NOT_CALLED.body,
            type: TYPES.REVIEW,
            to: supervisorId,
            sourceId: review._id
        });

        io.to(supervisorId).emit('notification.received', notification);

        socket.emit('not called sent', {nameKz: organization.nameKz, nameRu: organization.nameRu});

    });


    socket.on("send problem answer", async function (data: any) {

        if(!socket.auth) {
            socket.emit('Authentication required')
        }

        if(socket.client.userInfo.role !== ROLES.USER) {
            socket.emit('Permission required')
        }

        if(typeof(data.answer) === 'undefined' || !data.reviewId) {
            socket.emit('Answer for notification and reviewId must be provided');
            return;
        }

        let answer = data.answer;
        let reviewId = data.reviewId;

        let review = await Review.findById(reviewId);
        let supervisorId = await getSupervisorIdOfServiceProvider(review.serviceProviderId);

        let reviewStatus = review.status;

        if(answer === true) {

            let updatedReview = await Review.findByIdAndUpdate(reviewId, {
                status: 5
            }, {new: true});

            io.to(review.serviceProviderId).emit('Review.resolved', { review: updatedReview });

            if(reviewStatus == 2) {
                io.to(supervisorId).emit('Review.resolved', {review: updatedReview});
            }

            bus.emit('event.review.status.changed', {
                reviewId: review._id,
                type: REVIEW_HISTORY_TYPES.CONFIRM_RESOLVED
            });

            bus.emit('event.review.status.changed', {
                reviewId: review._id,
                type: REVIEW_HISTORY_TYPES.PROCESSED
            });

        } else {

            if(reviewStatus == 2) {
                io.to(supervisorId).emit('Review.not.resolved.again', {review});
                io.to(review.serviceProviderId).emit('Review.not.resolved', { review: review });
            } else {

                let updatedReview = await Review.findByIdAndUpdate(reviewId, {
                    status: 2
                }, {new: true});
                io.to(review.serviceProviderId).emit('Review.not.resolved', { review: updatedReview });
                io.to(supervisorId).emit('Review.not.resolved', {review: updatedReview});
            }


            bus.emit('event.review.status.changed', {
                reviewId: review._id,
                type: REVIEW_HISTORY_TYPES.CONFIRM_NOT_RESOLVED
            });

            bus.emit('event.review.status.changed', {
                reviewId: review._id,
                type: REVIEW_HISTORY_TYPES.ACTIVE
            });

        }

        if(answer)
            socket.emit('problem answer sent');
        else {
            let organization_ServiceProvider = await O_SP.findOne({
                serviceProviderId: review.serviceProviderId
            }).populateTs('organizationId');

            let organization: any = organization_ServiceProvider.organizationId;

            socket.emit('problem answer sent', {nameKz: organization.nameKz, nameRu: organization.nameRu});

        }

    });

});


const getSupervisorIdOfServiceProvider = async (serviceProviderId: any) => {
    let supervisor_serviceProvider = await S_SP.findOne({
        serviceProviderId
    });

    let supervisorId:any = supervisor_serviceProvider?supervisor_serviceProvider.userId:null;

    return supervisorId
};

const createNotification = async ({title, body, type, to, sourceId}: NotificationProps) => {

    let notification = new Notification({
        title,
        body,
        type,
        to,
        sourceId
    });

    await notification.save();

    return notification;
};

export = {
    socketStartUp,
    io
};