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
    const lst = $$('education-list');

    $('#company-name').text(GlobalData.CompanyNameMedium);

    function updateList() {
        $$('edit').disable();
        $$('delete').disable();
        lst.clear();
        for (let i=0 ; i < education.length ; i++)
            lst.add(i, education[i].school_name);
    }

    updateList();

    lst.onChange(() => {
        $$('edit').enable();
        $$('delete').enable();
    });

    $$('add').onclick(() => {
        app.index = -1;  //  new
        Utils.pushPage('mobile/EducationDetail/EducationDetail', null, 'school-name');
    });

    function edit() {
        app.index = lst.getValue();  //  index of item to edit
        Utils.pushPage('mobile/EducationDetail/EducationDetail');
    }

    $$('edit').onclick(edit);

    lst.onDblClick(edit);

    $$('delete').onclick(() => {
        const i = lst.getValue();
        Utils.yesNo('Delete', 'Is it okay to delete the selected record?', () => {
            if (education[i].education_id)
                Server.call(Framework.REST, 'DeleteEducation', { education_id: education[i].education_id }).then(res => {
                    if (res._Success) {
                        education.splice(i, 1);
                        updateList();
                    }
                });
            else {
                education.splice(i, 1);
                updateList();
            }
        });
    });

    $$('back').onclick(() => {
        delete app.index;
        Utils.popPage();
    });

})();
