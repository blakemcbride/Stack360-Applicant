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
    const employment = app.employment;
    let emp;

    $('#company-name').text(GlobalData.CompanyNameMedium);

    if (app.index === -1) {
        // new record
    } else {
        // existing record
        emp = employment[app.index];
        $$('company').setValue(emp.company);
        $$('phone').setValue(emp.phone);
        $$('job-title').setValue(emp.job_title);
        $$('responsibilities').setValue(emp.responsibilities);
        $$('start-date').setValue(emp.start_date * 100 + 1);  // we're only storing YYYYMM
        $$('end-date').setValue(emp.end_date * 100 + 1);  // we're only storing YYYYMM
        $$('supervisor').setValue(emp.supervisor);
        $$('contact-supervisor').setValue(emp.contact_supervisor);
        $$('reason-for-leaving').setValue(emp.reason_for_leaving);
        $$('street').setValue(emp.street);
        $$('city').setValue(emp.city);
        $$('state').setValue(emp.state);
    }

    $$('save').onclick(() => {
        if ($$('company').isError('Company'))
            return;
        if (app.index === -1) {
            // new record
            employment.push({});
            emp = employment[employment.length - 1];
        }
        emp.company = $$('company').getValue();
        emp.phone = $$('phone').getValue();
        emp.job_title = $$('job-title').getValue();
        emp.responsibilities = $$('responsibilities').getValue();
        emp.start_date = $$('start-date').getIntValue() / 100;  // we're only storing YYYYMM
        emp.end_date = $$('end-date').getIntValue() / 100;  // we're only storing YYYYMM
        emp.supervisor = $$('supervisor').getValue();
        emp.contact_supervisor = $$('contact-supervisor').getValue();
        emp.reason_for_leaving = $$('reason-for-leaving').getValue();
        emp.street = $$('street').getValue();
        emp.city = $$('city').getValue();
        emp.state = $$('state').getValue();
        emp.forceASCII = Utils.forceASCII;
        Server.call(Framework.REST, 'SaveApplication', app).then(async res => {
            if (res._Success) {
                await Framework.chkPerson(res, app);
            }
        });
    });

    $$('cancel').onclick(() => {
        Utils.popPage();
    });

})();
