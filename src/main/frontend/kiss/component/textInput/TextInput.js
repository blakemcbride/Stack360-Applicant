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

/*
      Author: Blake McBride
      Date:  4/18/18
 */

/* global Utils, Component */

'use strict';

(function () {

    const processor = function (elm, attr, content) {
        let nstyle, originalValue;
        let min = null;
        let max = null;
        let password = false;
        let upcase = false;
        let fixcap = false;
        if (attr.style)
            nstyle = attr.style;
        else
            nstyle = '';
        let nattrs = '';
        let id;
        let enterFunction = null;
        for (let prop in attr) {
            switch (prop) {

                // new attributes
                case 'minlength':
                    min = Number(Utils.removeQuotes(attr[prop]).replace(/-/g, ""));
                    break;
                case 'upcase':
                    upcase = true;
                    fixcap = false;
                    break;
                case 'required':
                    if (!min)
                        min = 1;
                    break;
                case 'password':
                    password = true;
                    break;
                case 'fixcap':
                    fixcap = true;
                    upcase = false;
                    break;

                // preexisting attributes
                case 'maxlength':
                    max = Number(Utils.removeQuotes(attr[prop]).replace(/-/g, ""));
                    nattrs += ' ' + prop + '="' + attr[prop] + '"';
                    break;
                case 'style':
                    break;  // already dealing with this
                case 'id':
                    id = Utils.removeQuotes(attr[prop]);
                    break;
                default:
                    nattrs += ' ' + prop + '="' + attr[prop] + '"';
                    break;
            }
        }

        nattrs += ' autocorrect="off" autocapitalize="off" spellcheck="false"';
        //       nattrs += ' data-lpignore="true"';  // kill lastpass

        const newElm = Utils.replaceHTML(id, elm, '<input type="{type}" style="{style}" {attr} placeholder="{placeholder}" id="{id}">', {
            type: password ? 'password' : 'text',
            style: nstyle,
            attr: nattrs,
            placeholder: content ? content.trim() : ''
        });
        if (!newElm)
            return;
        const jqObj = newElm.jqObj;

        function keyUpHandler(event) {
            if (enterFunction && event.key === 'Enter') {
                event.stopPropagation();
                enterFunction();
            }
            if (Utils.isChangeChar(event) || event.key === 'Enter')
                Utils.someControlValueChanged();
        }

        jqObj.keyup(keyUpHandler);

        newElm.setPassword = function (val) {
            let prev = password;
            password = val;
            jqObj.attr('type', password ? 'password' : 'text');
            return prev;
        }

        //--

        newElm.getValue = function () {
            let sval = jqObj.val();
            sval = sval ? sval.replace(/\s+/g, ' ').trim() : '';
            if (fixcap && sval)
                sval = Utils.fixCapitalization(sval);
            if (Utils.forceASCII)
                sval = Utils.toASCII(sval);
            if (max && sval && sval.length > max)
                sval = Utils.take(sval, max);
            return sval;
        };

        newElm.setValue = function (val) {
            if (val)
                val = val.trim();
            if (Utils.forceASCII)
                val = Utils.toASCII(val);
            if (!val) {
                jqObj.val(originalValue = '');
                return this;
            }
            if (upcase)
                val = val.toUpperCase();
            jqObj.val(originalValue = val);
            return this;
        };

        newElm.isDirty = function () {
            return originalValue !== newElm.getValue();
        };

        newElm.clear = function () {
            return newElm.setValue('');
        };

        //--

        newElm.readOnly = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.attr('readonly', flg);
            return this;
        };

        newElm.readWrite = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.attr('readonly', !flg);
            return this;
        };

        newElm.isReadOnly = function () {
            return !!jqObj.attr('readonly');
        };

        //--

        newElm.disable = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.prop('disabled', flg);
            return this;
        };

        newElm.enable = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            jqObj.prop('disabled', !flg);
            return this;
        };

        newElm.isDisabled = function () {
            return !!jqObj.attr('disabled');
        };

        //--

        newElm.hide = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg)
                jqObj.hide();
            else
                jqObj.show();
            return this;
        };

        newElm.show = function (flg = true) {
            flg = flg && (!Array.isArray(flg) || flg.length); // make zero length arrays false too
            if (flg)
                jqObj.show();
            else
                jqObj.hide();
            return this;
        };

        newElm.isHidden = function () {
            return jqObj.is(':hidden');
        };

        newElm.isVisible = function () {
            return jqObj.is(':visible');
        };

        //--

        newElm.onCChange = function (fun) {
            jqObj.off('keyup').keyup(function (event) {
                keyUpHandler(event);
                if (fun && Utils.isChangeChar(event))
                    fun(newElm.getValue());
            });
            return this;
        };

        newElm.onChange = function (fun) {
            jqObj.off('change');
            if (fun)
                jqObj.change(() => {
                    fun(newElm.getValue());
                });
            return this;
        };

        newElm.focus = function () {
            jqObj.focus();
            return this;
        };

        newElm.onEnter = function (fun) {
            enterFunction = fun;
            return this;
        }

        newElm.isError = function (desc) {
            if (min) {
                let val = newElm.getValue();
                val = val ? val.replace(/\s+/g, ' ').trim() : '';
                if (val.length < min) {
                    let msg;
                    if (min === 1)
                        msg = desc + ' is required.';
                    else
                        msg = desc + ' must be at least ' + min + ' characters long.';
                    Utils.showMessage('Error', msg).then(function () {
                        jqObj.focus();
                    });
                    return true;
                }
            }
            return false;
        };

        jqObj.on('input', function () {
            let val = jqObj.val().replace(/^\s+/, "");
            if (Utils.forceASCII)
                val = Utils.toASCII(val);
            jqObj.val(upcase ? val.toUpperCase() : val);
        });
    };

    const componentInfo = {
        name: 'TextInput',
        tag: 'text-input',
        processor: processor
    };
    Utils.newComponent(componentInfo);

})();


