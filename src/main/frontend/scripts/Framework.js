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



'use strict';


let Framework = function () {
};


Framework.REST = "com.arahant.services.custom.waytogo.apply";


Framework.logout = () => {
    Kiss.suspendDepth = 0;
    document.body.style.cursor = 'default';
    Framework.screenGroupStack = [];
    AWS.logout();
    Framework.needToLoadFramework = true;
    window.onbeforeunload = null;  //  allow logout
    location.reload();
};

Framework.chkPerson = async (res, app) => {
    /* The person_id can change if the SaveApplication call determines that this is an ex-employee or re-applying applicant with a different email address.
       The SaveOperation changes the person_id to the old pre-existing person_id. */
    if (!res.person_id) {
        // this means they are a prior applicant re-applying with a different email address
        await Utils.showMessage('Status', 'You have previously applied using a different email address.  Please reset your password for your new/current email address.')
        Framework.logout();
    }
    AWS.personId = res.person_id;
    app.person_id = res.person_id;
    Utils.popPage();
};
