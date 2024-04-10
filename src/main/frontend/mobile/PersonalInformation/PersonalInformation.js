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

/**
 * Author: Blake McBride
 * Date: 1/2/23
 */

'use strict';

(function () {

    const app = Utils.getData("application");

    $('#company-name').text(GlobalData.CompanyNameMedium);

    $$('fname').setValue(app.fname);
    $$('mname').setValue(app.mname);
    $$('lname').setValue(app.lname);
    $$('referred-by').setValue(app.referred_by);
    $$('street').setValue(app.street);
    $$('city').setValue(app.city);
    $$('state').setValue(app.state);
    $$('zip').setValue(app.zip);
    $$('email').setValue(app.personal_email);
    $$('ssan').setValue(app.ssn);
    $$('dob').setValue(app.dob);
    $$('phone-number').setValue(app.phone_number);
    $$('emergency-contact').setValue(app.contact_name);
    $$('relationship').setValue(app.relationship ? app.relationship.charAt(0) : '');
    $$('contact-phone').setValue(app.cell_phone);

    $$('save').onclick(() => {
        if ($$('fname').isError("First name"))
            return;
        if ($$('lname').isError("Last name"))
            return;
        if ($$('email').isError("Email"))
            return;
        const ssn = $$('ssan').getValue();
        if (ssn && !Utils.isValidSsn(ssn)) {
            Utils.showMessage('Error', 'Invalid social security number.');
            return;
        }

        app.fname = $$('fname').getValue();
        app.mname = $$('mname').getValue();
        app.lname = $$('lname').getValue();
        app.referred_by = $$('referred-by').getValue();
        app.street = $$('street').getValue();
        app.city = $$('city').getValue();
        app.state = $$('state').getValue();
        app.zip = $$('zip').getValue();
        app.personal_email = $$('email').getValue();
        app.ssn = Utils.formatSsn(ssn);
        app.dob = $$('dob').getIntValue();
        app.phone_number = $$('phone-number').getValue();
        app.contact_name = $$('emergency-contact').getValue();
        switch ($$('relationship').getValue()) {
            case 'S':
                app.relationship = 'Spouse';
                break;
            case 'P':
                app.relationship = 'Parent';
                break;
            case 'C':
                app.relationship = 'Child';
                break;
            case 'O':
                app.relationship = 'Other';
                break;
            default:
                app.relationship = null;
                break;
        }
        app.cell_phone = $$('contact-phone').getValue();

        Server.call(Framework.REST, 'SaveApplication', app).then(async res => {
            if (res._Success) {
                /* The person_id can change if the SaveApplication call determines that this is an ex-employee.
                   The SaveOperation changes the person_id to the old pre-existing person_id. */
                if (res.preExisting && res.personId) {
                    await Utils.showMessage('Status', 'You are already registered as an employee.');
                    Framework.logout();
                } else {
                    await Framework.chkPerson(res, app);
                }
            }
        });
    });

    $$('cancel').onclick(() => {
        Utils.popPage();
    });

})();
