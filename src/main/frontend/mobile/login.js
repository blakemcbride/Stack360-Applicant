/*
    STACK360 - Web-based Business Management System
    Copyright (C) 2024 Arahant LLC

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see https://www.gnu.org/licenses.
*/


/* global $$, Server, Utils */

'use strict';

(function () {

    let loginMode = false;

    $('#company-logo').attr('src', GlobalData.logoFile);
    $('#company-logo').css(GlobalData.logoStyle);

    function next() {
        if (loginMode) {
            login();
            return;
        }
        if ($$('username').isError('Email Address'))
            return;
        const email = $$('username').getValue();
        if (!Utils.isValidEmailAddress(email) && email !== "demo") {
            Utils.showMessage('Error', email + ' is not a valid email address');
            return;
        }
        Server.call(Framework.REST, 'EmailCheck', { email: email }).then(res => {
            if (res._Success) {
                if (res.status === 1)
                    Utils.pushPage('mobile/NewUser/NewUser', null, 'first-name', { username: email });
                else if (res.status === 2)
                    Utils.showMessage('Error', 'Invalid user type');
                else if (res.status === 3) {
                    Utils.showMessage('Error', 'An authentication email was sent to you. Please click on the link in that email in order to authenticate your email address. Or, click "Re-send" to resend the email.');
                    $('#resend-section').show();
                    $('#password-section').hide();
                    $('#reset-password-section').hide();
                } else if (res.status === 4) {
                    $('#resend-section').hide();
                    $('#password-section').show();
                    $('#reset-password-section').show();
                    $$('password').focus();
                    loginMode = true;
                    $$('cancel').show();
                }
            }
        });
    }

    $$('next').onclick(next);

    $$('username').onEnter(next);
    $$('password').onEnter(next);

    async function login() {
        if ($$('username').isError('Username'))
            return;
        if ($$('password').isError('Password'))
            return;
        AWS.setUser($$('username').getValue().toLowerCase(), $$('password').getValue());
        const data = await AWS.callSoap('Main', 'login', { loginType: "APPLICANT" });
        $$('password').clear();
        if (data.wsStatus === "0") {
            AWS.setUuid(data.uuid);
            AWS.setCompanyId(data.company.id);
            AWS.personId = data.personId;
            Framework.userInfo = data.personFName + ' ' + data.personLName;

            // prevent accidental browser back button
            window.onbeforeunload = function() {
                return "Back button hit.";
            };
            Utils.loadPage('mobile/Main/Main');
        } else {
            $$('password').focus();
        }
    }

    $$('username').focus();

    $$('resend-auth').onclick(() => {
        Server.call(Framework.REST, 'ResendAuthEmail', { email: $$('username').getValue() }).then(res => {
            if (res._Success) {
                Utils.showMessage('Status', 'A new authentication email has been sent to your email address.  Please be sure to check your spam folder.');
            }
        });
    });

    $$('cancel').onclick(() => {
        window.location.href = window.location.origin + window.location.pathname;
    });

    $$('reset-password').onclick(() => {
        Server.call(Framework.REST, 'ResetPassword', { email: $$('username').getValue() }).then(res => {
            if (res._Success) {
                Utils.showMessage('Status', 'A password reset email has been sent to your email address.  Please be sure to check your spam folder.');
            }
        });
    });

})();
