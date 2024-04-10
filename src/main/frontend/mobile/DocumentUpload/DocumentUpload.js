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
    const documents = app.documents;
    const lst = $$('document-list');

    $('#company-name').text(GlobalData.CompanyNameMedium);

    function updateList() {
        lst.clear();
        for (let i=0 ; i < documents.length ; i++)
            lst.add(i, documents[i].comments);
    }

    updateList();

    $$('add').onclick(() => {
        $$('comments').clear();
        $$('the-file').clear();
        Utils.popup_open('document-details', 'comments');

        $$('upload').onclick(() => {
            if ($$('comments').isError('Description'))
                return;
            if ($$('the-file').isError('A'))
                return;
            const data = {
                comments: $$('comments').getValue()
            };
            Server.fileUploadSend(Framework.REST, 'FileUpload', 'the-file', data).then(res => {
                if (res._Success) {
                    documents.push({
                        comments: data.comments,
                        person_form_id: null
                    });
                    updateList();
                    Utils.popup_close();
                }
            });
        });

        $$('cancel').onclick(() => {
            Utils.popup_close();
        });
    });

    $$('back').onclick(() => {
        Utils.popPage();
    });

})();
