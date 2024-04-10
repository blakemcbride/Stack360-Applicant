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


/* global Utils, Server */

'use strict';

var GlobalData = {};
GlobalData.CompanyName = "Demo";
GlobalData.CompanyNameMedium = "Demo";
GlobalData.CompanyNameLong = "Demo";

GlobalData.logoFile = "stack360-logo-v2-25.png";
GlobalData.logoStyle = {
    'margin-top': '40px',
    'height': '80px'
};

Utils.afterComponentsLoaded(function () {

    $('head title').text('Demo');

    if (window.location.protocol === "http:" && (window.location.port >= 8000 && window.location.port <= 8100 || window.location.port === '63342')) {
        AWS.setURL('http://' + window.location.hostname + ':8080');
    } else {
        //AWS.setURL('https://demo.stack360.io/backend');
        AWS.setURL('https://waytogo.arahant.com/arahant');
    }

    /*
    const screenPixels = screen.height * screen.width;
    if (screenPixels < 600000)
        Utils.loadPage("mobile/login");
    else if (screenPixels < 1000000)
        Utils.loadPage("tablet/login");
    else
        Utils.loadPage('login');
*/
    Utils.forceASCII = true;
    if (Utils.user && Utils.auth) {
        const data = {
            user: Utils.user,
            auth: Utils.auth
        }
        Server.call(Framework.REST, 'WhatDataNeeded', data).then(async res => {
            if (res._Success) {
                if (res.needPassword)
                    Utils.loadPage("mobile/CreatePassword/CreatePassword", null, "password1");
                else {
                    AWS.setUser(Utils.user, res.password);
                    const data = await AWS.callSoap('Main', 'login', { loginType: 'APPLICANT'});
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
                    }
                }
            } else {
                Utils.loadPage("mobile/login");
            }
        });
    } else
        Utils.loadPage("mobile/login");
});


(function () {
    Utils.useComponent('Popup');
    Utils.useComponent('CheckBox');
    Utils.useComponent('DateInput');
    Utils.useComponent('DropDown');
    Utils.useComponent('ListBox');
    Utils.useComponent('NumericInput');
    Utils.useComponent('PushButton');
    Utils.useComponent('RadioButton');
    Utils.useComponent('TextboxInput');
    Utils.useComponent('TextInput');
    Utils.useComponent('TextLabel');
    Utils.useComponent('TimeInput');
    Utils.useComponent('FileUpload');
    Utils.useComponent('NativeDateInput');
    Utils.useComponent('Picture');
})();

