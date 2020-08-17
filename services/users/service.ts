export {};
import bus from '@modules/bus';
import {emailConfig} from '@config'
const nodemailer = require('nodemailer');
import socket from "@socket";



const sendCredentials = (...args: any) => {

    const sendMail = async ({ mailserver, mail } : any) => {
        let transporter = nodemailer.createTransport(mailserver);

        let info = await transporter.sendMail(mail);

        console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
    };

    let config = {
        mailserver: emailConfig,
        mail: {
            from: 'Digital Agent mailer@api2.digitalagent.kz',
            to: args[0].email,
            subject: 'Пароль для входа на сайт digital-agent.kz',
            html: '<h2>Вы были зарегистрированы на платформе digitalagent.kz</h2>' +
                '<p>Вы были зарегистрированы на платформе digitalagent.kz как ' + args[0].role + '</p>' +
                '<p>Ваши данные для входа на сайт</p>' +
                '<ul>' +
                    '<li>Email: ' + args[0].email + '</li>' +
                    '<li>Пароль: ' + args[0].password + '</li>' +
                '</ul>'
        }
    };

    sendMail(config).catch(console.error);
};

const sendNewPassword = (...args: any) => {

    const sendMail = async ({ mailserver, mail } : any) => {
        let transporter = nodemailer.createTransport(mailserver);

        let info = await transporter.sendMail(mail);

        console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
    };

    let config = {
        mailserver: emailConfig,
        mail: {
            from: 'Digital Agent mailer@api2.digitalagent.kz',
            to: args[0].email,
            subject: 'Пароль для входа на сайт digital-agent.kz был сброшен',
            html: '<h2>' + args[0].name + ', ваш пароль на платформе digitalagent.kz был сброшен</h2>' +
                '<p>Ваш новый пароль:</p>' +
                '<p><strong>' + args[0].password + '</strong></p>'
        }
    };

    console.log(config);

    sendMail(config).catch(console.error);
};


const sendEmailForReview = (...args: any) => {

    const sendMail = async ({ mailserver, mail } : any) => {
        let transporter = nodemailer.createTransport(mailserver);

        let info = await transporter.sendMail(mail, (err:any, info:any) => {
            if(err) {
                console.log(err);
            } else {
                console.log("Email sent: " + info.response);
                socket.io.to(args[0].fromSocket).emit("email sent", "Email sent to user");
                socket.io.to(args[0].toSocket).emit("email received", "Email have been received for your review. Check your mail");
            }
        });

        console.log(`Preview: ${nodemailer.getTestMessageUrl(info)}`);
    };

    let config = {
        mailserver: emailConfig,
        mail: {
            from: 'Digital Agent mailer@api2.digitalagent.kz',
            to: args[0].to,
            subject: `Ответ на отзыв "${args[0].review.text}..." созданный в ${args[0].review.createdAt}`,
            text: args[0].text,
        }
    };

    sendMail(config);
};


bus.on('command.users.send-credentials', sendCredentials);
bus.on('command.users.send-new-password', sendNewPassword);
bus.on('command.reviews.send-email', sendEmailForReview);
