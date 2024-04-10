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
    const education = app.education;
    let ed;

    $('#company-name').text(GlobalData.CompanyNameMedium);

    if (app.index === -1) {
        // new record
    } else {
        // existing record
        ed = education[app.index];
        $$('school-name').setValue(ed.school_name);
        $$('subject').setValue(ed.subject);
        $$('end-date').setValue(ed.end_date * 100 + 1);  // we're only storing YYYYMM
        $$('school-location').setValue(ed.school_location);
        $$('graduate').setValue(ed.graduate);
        $$('current').setValue(ed.current === 'Y');
        $$('gpa').setValue(ed.gpa);
    }

    $$('save').onclick(() => {
        if ($$('school-name').isError('School'))
            return;
        if (app.index === -1) {
            // new record
            education.push({});
            ed = education[education.length - 1];
        }
        ed.school_name = $$('school-name').getValue();
        ed.subject = $$('subject').getValue();
        ed.end_date = $$('end-date').getIntValue() / 100;  // we're only storing YYYYMM
        ed.school_location = $$('school-location').getValue();
        ed.graduate = $$('graduate').getValue() ? $$('graduate').getValue() : 'N';
        ed.current = $$('current').getValue() ? 'Y' : 'N';
        ed.gpa = $$('gpa').getValue();
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
