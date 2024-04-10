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
All rights reserved.

 Created by Blake McBride on 1/20/16.
 */

/*
        This file is a modified version of what is in the KISS system.
        It has been moved here to reflect the fact that it is not the same.
 */

/* global DateTimeUtils, Framework, getScript, AGGrid, Server */

'use strict';

let Component = {};

Component.ComponentsBeingLoaded = 0;

Component.ComponentList = [];

let ActivePopups = [];  // only used in old popups

let PopupResolveStack = []; // only used in old popup routines

let Kiss = {};

/**
 * This is how components are accessed.
 *
 * @param {string} id  for radio buttons this is the id of the group, for other controls this is the control's id
 * @returns {*} the component object
 */
function $$(id) {
    if (typeof Kiss !== 'undefined' && typeof Kiss.RadioButtons !== 'undefined' && Kiss.RadioButtons.groups[id]) {
        const rbObj = {};
        let originalValue;
        rbObj.getValue = function () {
            return Kiss.RadioButtons.getValue(id);
        };
        rbObj.getIntValue = function () {
            let val = Kiss.RadioButtons.getValue(id);
            return val ? Number(val) : 0;
        };
        rbObj.setValue = function (val) {
            Kiss.RadioButtons.setValue(id, val);
            originalValue = rbObj.getValue();
            return rbObj;
        };
        rbObj.clear = function () {
            Kiss.RadioButtons.clear(id);
            originalValue = rbObj.getValue();
            return rbObj;
        };
        rbObj.isDirty = function () {
            return originalValue !== rbObj.getValue(id);
        };
        rbObj.readOnly = function () {
            Kiss.RadioButtons.readOnly(id);
            return rbObj;
        };
        rbObj.readWrite = function () {
            Kiss.RadioButtons.readWrite(id);
            return rbObj;
        };
        rbObj.isReadOnly = function () {
            return Kiss.RadioButtons.isReadOnly(id);
        };
        rbObj.onChange = function (fun) {
            Kiss.RadioButtons.onChange(id, fun);
            return rbObj;
        };
        rbObj.isError = function (lbl) {
            return Kiss.RadioButtons.isError(id, lbl);
        };
        rbObj.enable = function () {
            Kiss.RadioButtons.enable(id);
            return rbObj;
        };
        rbObj.disable = function () {
            Kiss.RadioButtons.disable(id);
            return rbObj;
        };
        rbObj.hide = function () {
            Kiss.RadioButtons.hide(id);
            return rbObj;
        };
        rbObj.show = function () {
            Kiss.RadioButtons.show(id);
            return rbObj;
        };
        rbObj.isHidden = function () {
            return Kiss.RadioButtons.isHidden(id);
        };
        rbObj.isVisible = function () {
            return Kiss.RadioButtons.isVisible(id);
        };
        rbObj.focus = function () {
            Kiss.RadioButtons.focus(id);
            return rbObj;
        };
        return rbObj;
    }
    const e = $((id.charAt(0) === '#' ? '' : '#') + id);
    return e.length ? e[0].kiss : null;
}

/**
 * General utilities class.
 */
class Utils {
    /**
     * Display a popup window with a message to the user.  The user will click "Ok" when they have read the message.
     * If the title is 'Error' the popup will appear in red.
     *
     * @param {string} title appears on the title bar of the message window
     * @param {string} message the message to be displayed
     * @returns {Promise} when popup disappears
     */
    static showMessage(title, message) {
        const self = this;
        Utils.waitMessageEnd();
        return new Promise(function (resolve, reject) {
            let modal = $('#msg-modal');
            if (!modal.length) {
                $('body').append(
                    '<div id="msg-modal" class="msg-modal">' +
                    '  <!-- Modal content -->' +
                    '  <div class="msg-modal-content" id="msg-modal-content-tab">' +
                    '    <div class="msg-modal-header" id="msg-modal-header-tab">' +
                    '      <span id="msg-close-btn" class="msg-close">&times;</span>' +
                    '      <p id="msg-header" style="margin-top: 2px;">Modal Header</p>' +
                    '    </div>' +
                    '    <div class="msg-modal-body">' +
                    '      <p id="msg-message" style="margin-top: 5px, margin-bottom: 5px;"></p>' +
                    '    </div>' +
                    '    <div class="msg-modal-footer">' +
                    '      <input type="button" value="Ok" id="message-ok" style="margin-top: 5px; margin-bottom: 10px;">' +
                    '    </div>' +
                    '  </div>' +
                    '</div>');
                modal = $('#msg-modal');  // the append changes this

                // Adjust width for mobile
                const content = $('#msg-modal-content-tab');
                const smaller = screen.width < screen.height ? screen.width : screen.height;
                if (smaller < content.width() + 20)
                    content.width(smaller-20);
            }

            $('#msg-header').text(title);
            const header = $('#msg-modal-header-tab');
            self.makeDraggable(header, $('#msg-modal-content-tab'));
            $('#msg-message').text(message);
            const closeBtn = $('#msg-close-btn');
            if (title === 'Error')
                header.css('background-color', 'red');
            else
                header.css('background-color', '#6495ed');
            function endfun() {
                modal.hide();
                resolve();
            }
            modal.show();
            let waitForKeyUp = false;
            closeBtn.off('click').click(function (e) {
                endfun();
            });
            $('#message-ok').off('click').off('keyup').click(function (e) {
                if (!waitForKeyUp)
                    endfun();
            }).focus().on('keyup', function (e) {
                e.stopPropagation();
                if (waitForKeyUp && e.key === 'Enter')
                    endfun();
            }).on('keydown', function (e) {
                e.stopPropagation();
                if (e.key === 'Enter')
                    waitForKeyUp = true;
            });
        });
    }

    /**
     * Display a modal popup that asks the user a yes/no question.
     *
     * The yesFun/noFun can be used, or this function returns a promise
     * so that it can be used with async/await.
     *
     * @param {string} title text on the title bar of the popup
     * @param {string} message the question being asked
     * @param {function} yesFun function that gets executed if the user clicks 'Yes'
     * @param {function} noFun function that gets executed if the user clicks 'No'
     */
    static yesNo(title, message, yesFun = null, noFun = null) {
        return new Promise(function(resolve, reject) {
            if (!$('#yesno-modal').length) {
                $('body').append(
                    '<div id="yesno-modal" class="msg-modal">' +
                    '  <!-- Modal content -->' +
                    '  <div class="msg-modal-content" id="yesno-popup-content">' +
                    '    <div class="msg-modal-header" id="yesno-popup-header">' +
                    '      <span id="yesno-close-btn" class="msg-close">&times;</span>' +
                    '      <p id="yesno-header" style="margin-top: 2px;">Modal Header</p>' +
                    '    </div>' +
                    '    <div class="msg-modal-body">' +
                    '      <p id="yesno-message" style="margin-top: 5px, margin-bottom: 5px;"></p>' +
                    '    </div>' +
                    '    <div class="msg-modal-footer">' +
                    '      <input type="button" value="Yes" id="yesno-yes" style="margin-top: 5px; margin-bottom: 10px;">' +
                    '      <input type="button" value="No" id="yesno-no" style="margin-top: 5px; margin-bottom: 10px; margin-left: 10px;">' +
                    '    </div>' +
                    '  </div>' +
                    '</div>');

                // Adjust width for mobile
                const content = $('#yesno-popup-content');
                const smaller = screen.width < screen.height ? screen.width : screen.height;
                if (smaller < content.width() + 20)
                    content.width(smaller-20);
            }
            Utils.makeDraggable($('#yesno-popup-header'), $('#yesno-popup-content'));

            $('#yesno-header').text(title);
            $('#yesno-message').text(message);
            const modal = $('#yesno-modal');
            const span = $('#yesno-close-btn');
            modal.show();
            span.off('click').click(function () {
                modal.hide();
                if (noFun)
                    noFun();
                resolve(false);
            });
            $('#yesno-yes').off('click').click(function () {
                modal.hide();
                if (yesFun)
                    yesFun();
                resolve(true);
            });
            $('#yesno-no').off('click').click(function () {
                modal.hide();
                if (noFun)
                    noFun();
                resolve(false);
            });
        });
    }

    /**
     * Display a modal popup with a message.  The message stays there until the application executes waitMessageEnd().
     * This method is used when the user needs to be notified to wait for a long running process.
     *
     * @param {string} message the message to be displayed
     */
    static waitMessage(message) {
        if (!$('#wmsg-modal').length) {
            $('body').append(
                '<div id="wmsg-modal" class="msg-modal">' +
                '  <!-- Modal content -->' +
                '  <div class="wmsg-modal-content" id="wait-msg-content">' +
                '    <div class="msg-modal-body">' +
                '      <p id="wmsg-message" style="margin-top: 5px, margin-bottom: 5px;"></p>' +
                '    </div>' +
                '  </div>' +
                '</div>');

            // Adjust width for mobile
            const content = $('#wait-msg-content');
            const smaller = screen.width < screen.height ? screen.width : screen.height;
            if (smaller < content.width() + 20)
                content.width(smaller-20);
        }
        const content = $('#wait-msg-content');
        this.makeDraggable(content, content);
        $('#wmsg-message').text(message);
        $('#wmsg-modal').show();
    }

    /**
     * This terminates the wait message initiated by waitMessage()
     */
    static waitMessageEnd() {
        $('#wmsg-modal').hide();
    }

    // static getID(id) {
    //     let e = $('#' + id);
    //
    //     if (!e.length) {
    //         id = id.replace(/_/g, '-');
    //         e = $('#' + id);
    //     }
    //
    //     if (!e.length) {
    //         id = id.replace(/-/g, '_');
    //         e = $('#' + id);
    //     }
    //
    //     return e.length ? id : null;
    // }

    static zeroPad(num, places) {
        const zero = places - num.toString().length + 1;
        return Array(+(zero > 0 && zero)).join("0") + num;
    }

    /**
     * Test the validity of a domain name.
     *
     * @param d {string} the domain to be tested
     * @returns {boolean} true if valid
     */
    static isValidDomain(d) {
        if (!d || typeof d !== 'string' || d.length < 3)
            return false;
        if (d.replaceAll(/[abcdefghijklmnopqrstuvwxyz0123456789.-]/gi, ''))
            return false;
        if (d[0] === '.' ||  d[d.length-1] === '.')
            return false;
        if (d.indexOf('..') !== -1)
            return false;
        if (d.indexOf('.') === -1)
            return false;
        return true;
    }

    /**
     * Test the validity of an email address.
     *
     * @param add {string} the email address to be tested
     * @returns {boolean} true if valid
     */
    static isValidEmailAddress(add) {
        if (!add || typeof add !== 'string' || add.length < 5)
            return false;
        if (add.replaceAll(/[abcdefghijklmnopqrstuvwxyz0123456789._-]/gi, '') !== '@')
            return false;
        const idx = add.indexOf("@");
        const dom = add.substr(idx+1);
        if (!Utils.isValidDomain(dom))
            return false;
        const user = add.substr(0, idx);
        if (user.length < 1  ||  user[0] === '.' ||  user[user.length-1] === '.')
            return false;
        if (user.indexOf('..') !== -1)
            return false;
        return true;
    }

    /**
     * Determines if an email address with or without a name is valid.
     * This accepts things like:
     *
     *    name@abc.com
     *    <name@abc.com>
     *    George Tall <name@abc.com>
     *    "Tall, George" <name.abc.com>
     *
     * @param ad {string}
     * @returns {boolean}
     */
    static isValidEmailAddressWithName(ad) {
        if (!ad || typeof ad !== 'string' || ad.length < 5)
            return false;
        const idx1 = ad.indexOf("<");
        if (idx1 === -1)
            return Utils.isValidEmailAddress(ad);
        const idx2 = ad.indexOf(">");
        if (idx2 < idx1 + 2)
            return false;
        const email = ad.substring(idx1+1, idx2-1);
        return Utils.isValidEmailAddress(email);
    }

    /**
     * Returns the email portion of an email address with a name.
     * For example, all of the following will return "abc.com":
     *
     *    name@abc.com
     *    <name@abc.com>
     *    George Tall <name@abc.com>
     *    "Tall, George" <name.abc.com>
     *
     * @param ad {string}
     * @returns {string}
     */
    static getEmailFromAddressWithName(ad) {
        const idx1 = ad.indexOf("<");
        if (idx1 === -1)
            return ad;
        const idx2 = ad.indexOf(">");
        return ad.substring(idx1+1, idx2);
    }

    /**
     * Returns the name portion of an email address with a name.
     * For example:
     *
     *    name@abc.com -> ""
     *    <name@abc.com> -> ""
     *    George Tall <name@abc.com> -> "George Tall"
     *    "Tall, George" <name.abc.com> -> "Tall, George"
     *
     * @param ad {string}
     * @returns {string}
     */
    static getNameFromAddressWithName(ad) {
        const idx1 = ad.indexOf("<");
        if (idx1 === -1)
            return "";
        let name = ad.substring(0, idx1).trim();
        if (!name)
            return "";
        if (name[0] === "'" && name[name.length-1] === "'" || name[0] === '"' && name[name.length-1] === '"')
            name = name.substring(1, name.length-1);
        return name;
    }

    /**
     * Splits a string containing any number of full email addresses with possible names into an array
     * where each element is a single address.
     *
     * @param s {string}
     * @returns {object} an array with the separated email addresses
     */
    static splitEmailAddresses(s) {
        if (!s || typeof s !== 'string' || s.length < 5)
            return [];
        const a = [];
        let inQuote = false;
        let quote;
        let add = "";
        for (let i=0 ; i < s.length ; i++) {
            let c = s[i];
            if (inQuote) {
                if (c === quote)
                    inQuote = false;
                add += c;
            } else {
                if (c === '"' || c === "'") {
                    inQuote = true;
                    quote = c;
                    add += c;
                } else if (c === ",") {
                    a.push(add);
                    add = "";
                } else
                    add += c;
            }
        }
        if (add)
            a.push(add);
        return a;
    }

    /**
     * APL-like take for strings.
     *
     * @param {string} s
     * @param {number} n
     * @returns {string}
     */
    static take(s, n) {
        if (!s)
            s = '';
        if (s.length === n)
            return s;
        if (n >= 0) {
            if (n < s.length)
                return s.substring(0, n);
            for (n -= s.length; n-- > 0;)
                s += ' ';
            return s;
        } else {
            n = -n;
            if (n < s.length)
                return Utils.drop(s, s.length - n);
            let sb = '';
            for (n -= s.length; n-- > 0;)
                sb += ' ';
            sb += s;
            return sb;
        }
    }

    /**
     * APL-like drop for strings.
     *
     * @param {string} s
     * @param {number} n
     * @returns {string}
     */
    static drop(s, n) {
        if (!s)
            s = '';
        if (!n)
            return s;
        if (n >= s.length || -n >= s.length)
            return '';
        if (n > 0)
            return s.substring(n);
        return s.substring(0, s.length + n);
    }

    /**
     * Turn undefined, null, NaN, "", a number, or a string into a number.
     * Handles M and K suffix.
     * Anything (except a valid string or number) becomes a zero.
     *
     * @param v
     * @returns {number}
     */
    static toNumber(v) {

        /**
         * Removes the currency symbol from the beginning of the given amount string.
         *
         * @param {string} amountString - The amount string from which to remove the currency symbol.
         * @return {string} The amount string with the currency symbol removed.
         */
        function removeCurrencySymbol(amountString) {
            // Expanded list of common currency symbols
            const symbols = [
                '$', '€', '£', '¥', '₹', '₽', 'R', '₺', 'A$', 'C$', 'NZ$', 'S$', 'HK$', 'kr', 'Mex$', 'Fr',
                'CHF', 'SEK', 'DKK', 'NOK', 'THB', '₪', '₫', '₱', 'RM', 'zł', 'Kč', 'HUF', '₡', '₲',
                'Q', '₸', '₼', 'лв', '₴', '₾', '֏', '₼', 'Bs.', '₭', '₦', '₨', '₲', '₵', '₸'
            ];

            // Remove the symbol if it is present
            for (let symbol of symbols)
                if (amountString.startsWith(symbol))
                    return amountString.replace(symbol, '').trim();

            // Return the original string if no symbol was found
            return amountString;
        }

        /**
         * Detects the grouping separator used in numeric formatting based on the specified locale.
         *
         * @param {string} [locale=navigator.language] - The locale to use for formatting the number.  Defaults to the local locale.
         * @return {string} The grouping separator character used in numeric formatting, or an empty string if not found.
         */
        function detectGroupingSeparator(locale = navigator.language) {
            if (Utils.numericGroupCharacter === undefined) {
                const largeNumber = 1234567; // Use a number that will definitely have grouping separators
                const formattedNumber = new Intl.NumberFormat(locale).format(largeNumber);

                // Find the character that is not a digit and comes after the first digit (which will be the grouping separator)
                for (let i = 0; i < formattedNumber.length; i++) {
                    if (!/\d/.test(formattedNumber[i]) && /\d/.test(formattedNumber[i - 1])) {
                        Utils.numericGroupCharacter = formattedNumber[i];
                        break;
                    }
                }
                if (Utils.numericGroupCharacter === undefined)
                    Utils.numericGroupCharacter = '';
            }
            return Utils.numericGroupCharacter;
        }

        if (typeof v === 'number')
            return isNaN(v) ? 0 : v;
        if (typeof v !== 'string'  ||  !v.trim())
            return 0;
        v = removeCurrencySymbol(v).replaceAll('[ %]', '').replaceAll(detectGroupingSeparator(), '');
        let kilo, mega;
        if (kilo = (/k/i.test(v)))
            v = v.replace(/k/i, '');
        if (mega = (/m/i.test(v)))
            v = v.replace(/m/i, '');
        const r = Number(v);
        return isNaN(r) ? 0 : r * (kilo ? 1000 : mega ? 1000000 : 1);
    }

    /**
     *  Numeric formatter.  Takes a number and converts it to a nicely formatted String in a specified number base.
     *
     * @param {number} num    number to be formatted
     * @param {number} base   numeric base (like base 2 = binary, 16=hex...)
     * @param {string} msk    format mask - any combination of the following:<br>
     *  <ul>
     *     <li>B = blank if zero</li>
     *     <li>C = add commas</li>
     *     <li>L = left justify number</li>
     *     <li>P = put parentheses around negative numbers</li>
     *     <li>Z = zero fill</li>
     *     <li>D = floating dollar sign</li>
     *     <li>U = uppercase letters in conversion</li>
     *     <li>R = add a percent sign to the end of the number</li>
     *  </ul>
     * @param  {number} wth    total field width (0 means auto)
     * @param  {number} dp    number of decimal places (-1 means auto)
     * @return {string} the formatted String
     *<p>
     * Example:
     *<br><br>
     *    let r = utils.formatb(-12345.348, 10, "CP", 12, 2);
     *<br><br>
     *    result in r:   "(12,345.35)"
     * </p>
     *
     * @see Utils.format
     */
    static formatb(num, base, msk, wth, dp) {
        let si, i, r, n;
        let sign, blnk, comma, left, paren, zfill, nd, dol, tw, dl, ez, ucase, cf, percent;
        let dbase;
        const alpha = '0123456789abcdefghijklmnopqrstuvwxyz';

        if (base < 2 || base > alpha.length)
            base = 10;
        dbase = base;

        if (num < 0.0) {
            num = -num;
            sign = 1;
        } else
            sign = 0;

        /*  round number  */

        if (dp >= 0) {
            r = Math.pow(dbase, dp);
//    n = Math.floor(base/20.0 + n * r) / r;
            num = Math.floor(.5 + num * r) / r;
        }
        switch (base) {
            case 10:
                cf = 3;
                dl = num < 1.0 ? 0 : 1 + Math.floor(Math.log10(num));
                /* # of digits left of .  */
                break;
            case 2:
                cf = 4;
                dl = num < 1.0 ? 0 : 1 + Math.floor(Math.log(num) / .6931471806);
                /* # of digits left of .  */
                break;
            case 8:
                cf = 3;
                dl = num < 1.0 ? 0 : 1 + Math.floor(Math.log(num) / 2.079441542);
                /* # of digits left of .  */
                break;
            case 16:
                cf = 4;
                dl = num < 1.0 ? 0 : 1 + Math.floor(Math.log(num) / 2.772588722);
                /* # of digits left of .  */
                break;
            default:
                cf = 3;
                dl = num < 1.0 ? 0 : 1 + Math.floor(Math.log(num) / Math.log(dbase));
                /* # of digits left of .  */
                break;
        }

        if (dp < 0) {   /* calculate the number of digits right of decimal point */
            n = num < 0.0 ? -num : num;
            dp = 0;
            while (dp < 20) {
                n -= Math.floor(n);
                if (1E-5 >= n)
                    break;
                dp++;
                /*  round n to 5 places     */
                r = Math.pow(10, 5);
                r = Math.floor(.5 + Math.abs(n * base * r)) / r;
                n = n < 0.0 ? -r : r;
            }
        }
        blnk = comma = left = paren = zfill = dol = ucase = percent = 0;
        if (msk) {
            msk = msk.toUpperCase();
            for (let i2 = 0; i2 < msk.length; i2++)
                switch (msk.charAt(i2)) {
                    case 'B':  // blank if zero
                        blnk = 1;
                        break;
                    case 'C':  //  add commas
                        comma = Math.floor((dl - 1) / cf);
                        if (comma < 0)
                            comma = 0;
                        break;
                    case 'L':  //  left justify
                        left = 1;
                        break;
                    case 'P':  //  parens around negative numbers
                        paren = 1;
                        break;
                    case 'Z':  //  zero fill
                        zfill = 1;
                        break;
                    case 'D':  //  dollar sign
                        dol = 1;
                        break;
                    case 'U':  //  upper case letters
                        ucase = 1;
                        break;
                    case 'R':  //  add percent
                        percent = 1;
                        break;
                }
        }
        /*  calculate what the number should take up   */

        ez = num < 1.0 ? 1 : 0;
        tw = dol + paren + comma + sign + dl + dp + (dp === 0 ? 0 : 1) + ez + percent;
        if (wth < 1)
            wth = tw;
        else if (tw > wth) {
            if (ez)
                tw -= ez--;
            if ((i = dol) && tw > wth)
                tw -= dol--;
            if (tw > wth && comma) {
                tw -= comma;
                comma = 0;
            }
            if (tw < wth && i) {
                tw++;
                dol = 1;
            }
            if (tw > wth && paren)
                tw -= paren--;
            if (tw > wth && percent)
                tw -= percent--;
            if (tw > wth) {
                let tbuf = '';
                for (i = 0; i < wth; i++)
                    tbuf += '*';
                return tbuf;
            }
        }
        let buf = new Array(wth);
        num = Math.floor(.5 + num * Math.floor(.5 + Math.pow(dbase, dp)));
        if (blnk && num === 0.0) {
            for (i = 0; i < wth;)
                buf[i++] = ' ';
            return buf.join('');
        }
        si = wth;

        if (left && wth > tw)
            for (i = wth - tw; i--;)
                buf[--si] = ' ';
        if (paren)
            buf[--si] = sign ? ')' : ' ';
        if (percent)
            buf[--si] = '%';
        for (nd = 0; nd < dp && si; nd++) {
            num /= dbase;
            i = Math.floor(dbase * (num - Math.floor(num)) + .5);
            num = Math.floor(num);
            buf[--si] = ucase && i > 9 ? alpha.charAt(i).toUpperCase() : alpha.charAt(i);
        }
        if (dp)
            if (si)
                buf[--si] = '.';
            else
                num = 1.0;
        if (ez && si > sign + dol)
            buf[--si] = '0';
        nd = 0;
        while (num > 0.0 && si)
            if (comma && nd === cf) {
                buf[--si] = ',';
                nd = 0;
            } else {
                num /= dbase;
                i = Math.floor(dbase * (num - Math.floor(num)) + .5);
                num = Math.floor(num);
                buf[--si] = ucase && i > 9 ? alpha.charAt(i).toUpperCase() : alpha.charAt(i);
                nd++;
            }
        if (zfill)
            for (i = sign + dol; si > i;)
                buf[--si] = '0';
        if (dol && si)
            buf[--si] = '$';
        if (sign)
            if (si)
                buf[--si] = paren ? '(' : '-';
            else
                num = 1.0;
        /*  signal error condition */

        while (si)
            buf[--si] = ' ';

        if (num !== 0.0)         /*  should never happen. but just in case  */
            for (i = 0; i < wth;)
                buf[i++] = '*';

        return buf.join('');
    }

    static localeCurrencyMap = {
        'en-US': 'USD', // United States Dollar
        'en-GB': 'GBP', // British Pound Sterling
        'de-DE': 'EUR', // Euro (Germany)
        'fr-FR': 'EUR', // Euro (France)
        'es-ES': 'EUR', // Euro (Spain)
        'it-IT': 'EUR', // Euro (Italy)
        'nl-NL': 'EUR', // Euro (Netherlands)
        'el-GR': 'EUR', // Euro (Greece)
        'pt-PT': 'EUR', // Euro (Portugal)
        'ja-JP': 'JPY', // Japanese Yen
        'zh-CN': 'CNY', // Chinese Yuan
        'ru-RU': 'RUB', // Russian Ruble
        'in-IN': 'INR', // Indian Rupee
        'ar-SA': 'SAR', // Saudi Riyal
        'ko-KR': 'KRW', // South Korean Won
        'tr-TR': 'TRY', // Turkish Lira
        'sv-SE': 'SEK', // Swedish Krona
        'da-DK': 'DKK', // Danish Krone
        'nb-NO': 'NOK', // Norwegian Krone
        'fi-FI': 'EUR', // Euro (Finland)
        'pl-PL': 'PLN', // Polish Zloty
        'cs-CZ': 'CZK', // Czech Koruna
        'hu-HU': 'HUF', // Hungarian Forint
        'ro-RO': 'RON', // Romanian Leu
        'bg-BG': 'BGN', // Bulgarian Lev
        'en-CA': 'CAD', // Canadian Dollar
        'en-AU': 'AUD', // Australian Dollar
        'en-NZ': 'NZD', // New Zealand Dollar
        'th-TH': 'THB', // Thai Baht
        'id-ID': 'IDR', // Indonesian Rupiah
        'ms-MY': 'MYR', // Malaysian Ringgit
        'vi-VN': 'VND', // Vietnamese Dong
        'tl-PH': 'PHP', // Philippine Peso
        'he-IL': 'ILS', // Israeli New Shekel
        'ar-AE': 'AED', // United Arab Emirates Dirham
        'en-ZA': 'ZAR', // South African Rand
        'en-SG': 'SGD', // Singapore Dollar
        'en-HK': 'HKD', // Hong Kong Dollar
        'es-MX': 'MXN', // Mexican Peso
        'pt-BR': 'BRL', // Brazilian Real
        'en-IE': 'EUR', // Euro (Ireland)
        'en-CH': 'CHF', // Swiss Franc (Switzerland)
        'nl-BE': 'EUR', // Euro (Belgium)
        'en-AT': 'EUR', // Euro (Austria)
        'en-CY': 'EUR', // Euro (Cyprus)
        'et-EE': 'EUR', // Euro (Estonia)
        'fi-AX': 'EUR', // Euro (Åland Islands)
        'fr-GF': 'EUR', // Euro (French Guiana)
        'es-AR': 'ARS', // Argentine Peso
        'pt-AO': 'AOA', // Angolan Kwanza
        'en-BS': 'BSD', // Bahamian Dollar
        'en-BB': 'BBD', // Barbadian Dollar
        'en-BZ': 'BZD', // Belize Dollar
        'en-BM': 'BMD', // Bermudian Dollar
        'es-BO': 'BOB', // Bolivian Boliviano
        'nl-BQ': 'USD', // United States Dollar (Caribbean Netherlands)
        'pt-CV': 'CVE', // Cape Verdean Escudo
        'en-KY': 'KYD', // Cayman Islands Dollar
        'es-CL': 'CLP', // Chilean Peso
        'es-CO': 'COP', // Colombian Peso
        'es-CR': 'CRC', // Costa Rican Colón
        'es-CU': 'CUP', // Cuban Peso
        'en-DM': 'XCD', // East Caribbean Dollar (Dominica)
        'es-DO': 'DOP', // Dominican Peso
        'fr-DJ': 'DJF', // Djiboutian Franc
        'ar-DZ': 'DZD', // Algerian Dinar
        'en-EG': 'EGP', // Egyptian Pound
        'am-ET': 'ETB', // Ethiopian Birr
        'en-FJ': 'FJD', // Fijian Dollar
        'fr-GA': 'XAF', // Central African CFA Franc (Gabon)
        'en-GH': 'GHS', // Ghanaian Cedi
        'en-GM': 'GMD', // Gambian Dalasi
        'en-GY': 'GYD', // Guyanese Dollar
        'es-GT': 'GTQ', // Guatemalan Quetzal
        'en-GD': 'XCD', // East Caribbean Dollar (Grenada)
        'fr-GP': 'EUR', // Euro (Guadeloupe)
        'es-HN': 'HNL', // Honduran Lempira
        'en-JM': 'JMD', // Jamaican Dollar
        'ar-JO': 'JOD', // Jordanian Dinar
        'kk-KZ': 'KZT', // Kazakhstani Tenge
        'rw-RW': 'RWF', // Rwandan Franc
        'ko-KP': 'KPW', // North Korean Won
        'ar-KW': 'KWD', // Kuwaiti Dinar
        'kk-KG': 'KGS', // Kyrgyzstani Som
        'lo-LA': 'LAK', // Lao Kip
        'lv-LV': 'EUR', // Euro (Latvia)
        'ar-LB': 'LBP', // Lebanese Pound
        'st-ST': 'STD', // São Tomé and Príncipe Dobra
        'fr-CI': 'XOF', // CFA Franc BCEAO (Ivory Coast)
        'pt-MZ': 'MZN', // Mozambican Metical
        'sw-TZ': 'TZS', // Tanzanian Shilling
        'en-KE': 'KES', // Kenyan Shilling
        'fr-CM': 'XAF', // Central African CFA Franc (Cameroon)
        'en-NG': 'NGN', // Nigerian Naira
        'fr-MG': 'MGA', // Malagasy Ariary
        'en-UG': 'UGX', // Ugandan Shilling
        'en-ZM': 'ZMW', // Zambian Kwacha
        'fr-BF': 'XOF', // CFA Franc BCEAO (Burkina Faso)
        'fr-SN': 'XOF', // CFA Franc BCEAO (Senegal)
        'en-LR': 'LRD', // Liberian Dollar
        'en-SL': 'SLL', // Sierra Leonean Leone
        'ar-SD': 'SDG', // Sudanese Pound
        'ar-ER': 'ERN', // Eritrean Nakfa
        'so-SO': 'SOS', // Somali Shilling
        'ar-EG': 'EGP', // Egyptian Pound (Egypt)
        'sw-KE': 'KES', // Kenyan Shilling (Kenya)
        'en-TZ': 'TZS', // Tanzanian Shilling (Tanzania)
        'fr-BJ': 'XOF', // West African CFA franc (Benin)
        'en-ZW': 'ZWL', // Zimbabwean Dollar (Zimbabwe)
        'en-NA': 'NAD', // Namibian Dollar (Namibia)
        'fr-CD': 'CDF', // Congolese Franc (Democratic Republic of the Congo)
        'pt-GW': 'XOF', // CFA Franc BCEAO (Guinea-Bissau)
        'fr-MC': 'EUR', // Euro (Monaco)
        'en-SC': 'SCR', // Seychellois Rupee (Seychelles)
        'en-AG': 'XCD', // East Caribbean Dollar (Antigua and Barbuda)
        'fr-BI': 'BIF', // Burundian Franc (Burundi)
        'fr-TD': 'XAF', // Central African CFA Franc (Chad)
        'fr-KM': 'KMF', // Comorian Franc (Comoros)
        'pt-TL': 'USD', // United States Dollar (East Timor)
        'en-FK': 'FKP', // Falkland Islands Pound (Falkland Islands)
        'fr-GQ': 'XAF', // Central African CFA Franc (Equatorial Guinea)
        'en-SH': 'SHP', // Saint Helena Pound (Saint Helena)
        'en-KI': 'AUD', // Australian Dollar (Kiribati)
        'en-MH': 'USD', // United States Dollar (Marshall Islands)
        'en-FM': 'USD', // United States Dollar (Micronesia)
        'en-NR': 'AUD', // Australian Dollar (Nauru)
        'en-PW': 'USD', // United States Dollar (Palau)
        'en-PG': 'PGK', // Papua New Guinean Kina (Papua New Guinea)
        'en-WS': 'WST', // Samoan Tala (Samoa)
        'en-SB': 'SBD', // Solomon Islands Dollar (Solomon Islands)
        'en-TO': 'TOP', // Tongan Paʻanga (Tonga)
        'en-TV': 'AUD', // Australian Dollar (Tuvalu)
        'en-VU': 'VUV', // Vanuatu Vatu (Vanuatu)
        'fr-PF': 'XPF', // CFP Franc (French Polynesia)
        'fr-NC': 'XPF', // CFP Franc (New Caledonia)
        'fr-WF': 'XPF', // CFP Franc (Wallis and Futuna)
        'en-GG': 'GBP', // British Pound Sterling (Guernsey)
        'en-IM': 'GBP', // British Pound Sterling (Isle of Man)
        'en-JE': 'GBP', // British Pound Sterling (Jersey)
        'en-GI': 'GIP', // Gibraltar Pound (Gibraltar)
        'fr-ML': 'XOF', // West African CFA franc (Mali)
        'pt-ST': 'STN', // São Tomé and Príncipe Dobra (São Tomé and Príncipe)
        'fr-NE': 'XOF', // West African CFA franc (Niger)
        'en-LS': 'LSL', // Lesotho Loti (Lesotho)
        'en-BW': 'BWP', // Botswana Pula (Botswana)
        'en-MU': 'MUR', // Mauritian Rupee (Mauritius)
        'ar-IQ': 'IQD', // Iraqi Dinar (Iraq)
        'ar-LY': 'LYD', // Libyan Dinar (Libya)
        'ar-MA': 'MAD', // Moroccan Dirham (Morocco)
        'ar-TN': 'TND', // Tunisian Dinar (Tunisia)
        'ar-YE': 'YER', // Yemeni Rial (Yemen)
        'en-BN': 'BND', // Brunei Dollar (Brunei)
        'ms-BN': 'BND', // Brunei Dollar (Brunei, Malay)
        'km-KH': 'KHR', // Cambodian Riel (Cambodia)
        'my-MM': 'MMK', // Myanmar Kyat (Myanmar)
        'ne-NP': 'NPR', // Nepalese Rupee (Nepal)
        'dz-BT': 'BTN', // Bhutanese Ngultrum (Bhutan)
        'en-BT': 'BTN', // Bhutanese Ngultrum (Bhutan, English)
        'en-MV': 'MVR', // Maldivian Rufiyaa (Maldives)
        'dv-MV': 'MVR', // Maldivian Rufiyaa (Maldives, Dhivehi)
        'en-CK': 'NZD', // New Zealand Dollar (Cook Islands)
        'bi-KI': 'AUD', // Australian Dollar (Kiribati, Gilbertese)
        'sm-WF': 'XPF', // CFP Franc (Wallis and Futuna, Samoan)
        'ty-PF': 'XPF', // CFP Franc (French Polynesia, Tahitian)
        // ... add more as needed
    };

    /**
     *  Numeric formatter.  Takes a number and converts it to a nicely formatted String (for number in base 10).
     *  Correctly handles international formatting rules.
     *
     * @param {number} num    number to be formatted
     * @param {string} msk    format mask - any combination of the following:<br>
     *  <ul>
     *     <li>B = blank if zero</li>
     *     <li>C = add commas</li>
     *     <li>L = left justify number</li>
     *     <li>P = put parentheses around negative numbers</li>
     *     <li>Z = zero fill</li>
     *     <li>D = floating dollar or monetary symbol</li>
     *     <li>M = monetary (same as 'D')</li>
     *     <li>R = add a percent sign to the end of the number</li>
     *  </ul>
     * @param  {number} wth    total field width (0 means auto)
     * @param  {number} dp    number of decimal places (-1 means auto)
     * @return {string} string the formatted String
     *<p>
     * example:
     *<br><br>
     *    let r = Utils.format(-12345.348, "CP", 12, 2);
     *<br><br>
     *    result in r:  "(12,345.35)"
     * </p>
     */
    static format(num, msk, wth, dp) {
        const options = {};
        let blnk=false, comma=false, left=false, paren=false, zfill=false, dol=false, ucase=false, percent=false;
        if (msk) {
            msk = msk.toUpperCase();
            for (let i2 = 0; i2 < msk.length; i2++)
                switch (msk.charAt(i2)) {
                    case 'B':  // blank if zero
                        blnk = true;
                        break;
                    case 'S':  //  add separator
                    case 'C':  //  add commas
                        comma = true;
                        break;
                    case 'L':  //  left justify
                        left = true;
                        break;
                    case 'P':  //  parens around negative numbers
                        paren = true;
                        break;
                    case 'Z':  //  zero fill
                        zfill = true;
                        break;
                    case 'M':  //  monetary
                    case 'D':  //  dollar sign
                        dol = true;
                        break;
                    case 'U':  //  upper case letters
                        ucase = true;
                        break;
                    case 'R':  //  add percent
                        percent = true;
                        break;
                }
        }
        if (percent)
            num /= 100;
        if (blnk && num < .0001 && num > -.0001)
            return wth > 0 ? ' '.repeat(wth) : '';
        options.useGrouping = comma;
        if (dp !== -1) {
            options.minimumFractionDigits = dp;
            options.maximumFractionDigits = dp;
        }
        if (dol) {
            options.style = "currency";
            let currency = this.localeCurrencyMap[navigator.language];
            if (!currency)
                currency = "USD";
            options.currency = currency;
            if (paren)
                options.currencySign = "accounting";
        } else if (percent)
            options.style = "percent";
        let ret;
        if (!dol && paren) {
            if (num < 0)
                ret = '(' + (new Intl.NumberFormat(navigator.language, options)).format(-num) + ')';
            else
                ret = (new Intl.NumberFormat(navigator.language, options)).format(num) + ' ';
        } else
            ret = (new Intl.NumberFormat(navigator.language, options)).format(num);
        if (wth > 0) {
            if (ret.length > wth)
                if (comma)
                    return Utils.format(num, base, msk.replaceAll("[Cc]", ""), wth, dp);
                else
                    return '*'.repeat(wth);
            if (left)
                ret = ret.padEnd(wth, ' ');
            else
                ret = ret.padStart(wth, zfill ? '0' : ' ');
        }
        return ret;
    }

    /**
     * Get the extension of the file name.  So, "abc.def" would return "def".
     *
     * @param {string} filename
     * @returns {string}
     */
    static fileNameExtension(filename) {
        const fileSplit = filename.split('.');
        let fileExt = '';
        if (fileSplit.length > 1)
            fileExt = fileSplit[fileSplit.length - 1];
        return fileExt;
    }

    /**
     * When calling a SOAP web service, array returns are not arrays but single objects when there is only one element.
     * (XML to Json problem).  This function assures that an element is an array when one is expected.
     *
     * @param x
     * @returns {Array}
     */
    static assureArray(x) {
        if ($.isArray(x))
            return x;
        let r = [];
        if (x)
            r[0] = x;
        return r;
    }

    /**
     * Parse the URL string and extract the URL parameters.
     *
     * @param {string} key parameter name
     * @returns {string} the parameter value or null if not there
     */
    static getURLParam(key) {
        const url = window.location.href;
        const args = url.split('?');
        if (args.length !== 2)
            return null;
        const pairs = args[1].split('&');
        if (pairs.length === 0)
            return null;
        for (let i = 0; i < pairs.length; i++) {
            let keyval = pairs[i].split('=');
            if (keyval[0] === key)
                if (keyval.length > 0)
                    return decodeURI(keyval[1]);
                else
                    return '';
        }
        return null;
    }

    /**
     * Returns the root URL of the application.
     *
     * @returns {string}
     */
    static getAppUrl() {
        let loc = window.location.href;
        let i = loc.indexOf('?');
        if (i > 0)
            loc = loc.substring(0, i);
        i = loc.lastIndexOf('/');
        return i > 0 ? loc.substring(0, i) : loc;
    }

    /**
     * Load a modal dialog from the current screen location.
     *
     * @param {string} modal Name of the modal.
     */
    static loadModal(modal) {
        let npath;

        function loadScript(arg) {
            getScript(npath + '.js' + arg);
        }

        function loadComponent(arg) {
            npath = `${Framework.lastLoadedScreen.substring(0, Framework.lastLoadedScreen.lastIndexOf("/"))}/${modal}`;
            loadScript(arg);
        };

        if (typeof Component === 'undefined' || typeof Utils.softwareVersion === 'undefined')
            $.getScript('/components/ComponentVersions.js?new=' + (new Date()).getTime()).then(function (data, textStatus, jqxhr) {
                let ver;
                if (typeof Component !== 'undefined' && typeof Utils.softwareVersion !== 'undefined')
                    ver = '?ver=' + Utils.softwareVersion;
                else
                    ver = '';
                loadComponent(Utils.controlCache ? ver : '');
            });
        else
            loadComponent(Utils.controlCache ? '?ver=' + Utils.softwareVersion : '');
    }

    // internal
    static tagReplace(inp, rpl) {
        for (let prop in rpl) {
            let val = rpl[prop];
            if (!val && val !== 0)
                val = '';
            inp = inp.replace(new RegExp('{' + prop + '}', 'g'), val);
        }
        return inp;
    }

    // internal
    static afterComponentsLoaded(fun) {
        Component.AfterAllComponentsLoaded = fun;
    }

    /*    (internal)
     * Rescan the HTML file and replace KISS components with HTML components.
     * This needs to be done each time new KISS controls are attached.
     */
    static rescan() {
        let n = -1;
        while (n) {  // keep replacing until nothing left to replace
            n = 0;
            for (let i = 0; i < Component.ComponentList.length; i++) {
                let ci = Component.ComponentList[i];
                if (ci.tag && ci.name === 'Popup') {
                    $(ci.tag).each(function () {
                        let elm = $(this);
                        ci.processor(elm, Utils.getAllAttributes(elm), elm.html());
                        n++;
                    });
                    break;
                }
            }
            for (let i = 0; i < Component.ComponentList.length; i++) {
                let ci = Component.ComponentList[i];
                if (ci.tag && ci.name !== "Popup")
                    $(ci.tag).each(function () {
                        let elm = $(this);
                        ci.processor(elm, Utils.getAllAttributes(elm), elm.html());
                        n++;
                    });
            }
        }
    }

    /**
     * Loads a component (new HTML element)
     *
     * @param {string} path back-end path to the component HTML and JS files.
     */
    static useComponent(path) {
        Component.ComponentsBeingLoaded++;
        const npath = 'kiss/component/' + path.charAt(0).toLowerCase() + path.substring(1) + '/' + path.charAt(0).toUpperCase() + path.substring(1) + '.js';
        getScript(npath).then(function () {
            if (!--Component.ComponentsBeingLoaded && Component.AfterAllComponentsLoaded) {
                Utils.rescan();  // does all the tag replacement
                Component.AfterAllComponentsLoaded();
                Component.AfterAllComponentsLoaded = null;
            }
        });
    }

    static getAllAttributes(elm) {
        const ret = {};
        $.each(elm[0].attributes, function () {
            ret[this.name] = this.value;
        });
        return ret;
    }

    static removeQuotes(s) {
        if (!s || !s.length)
            return '';
        let c = s.charAt(0);
        if (c === '"' || c === "'")
            s = s.substr(1);
        if (!s.length)
            return '';
        c = s.slice(-1);  // last character
        if (c === '"' || c === "'")
            s = s.substring(0, s.length - 1);
        return s;
    }

    static newComponent(ci) {
        Component.ComponentList.push(ci);
        Component[ci.name] = {};
    }

    /**
     * Emits an audible beep on the user's computer.
     *
     */
    static beep() {
        const snd = new Audio("data:audio/wav;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7xA4Tvh9Rz/y8QADBwMWgQAZG/ILNAARQ4GLTcDeIIIhxGOBAuD7hOfBB3/94gcJ3w+o5/5eIAIAAAVwWgQAVQ2ORaIQwEMAJiDg95G4nQL7mQVWI6GwRcfsZAcsKkJvxgxEjzFUgfHoSQ9Qq7KNwqHwuB13MA4a1q/DmBrHgPcmjiGoh//EwC5nGPEmS4RcfkVKOhJf+WOgoxJclFz3kgn//dBA+ya1GhurNn8zb//9NNutNuhz31f////9vt///z+IdAEAAAK4LQIAKobHItEIYCGAExBwe8jcToF9zIKrEdDYIuP2MgOWFSE34wYiR5iqQPj0JIeoVdlG4VD4XA67mAcNa1fhzA1jwHuTRxDUQ//iYBczjHiTJcIuPyKlHQkv/LHQUYkuSi57yQT//uggfZNajQ3Vmz+Zt//+mm3Wm3Q576v////+32///5/EOgAAADVghQAAAAA//uQZAUAB1WI0PZugAAAAAoQwAAAEk3nRd2qAAAAACiDgAAAAAAABCqEEQRLCgwpBGMlJkIz8jKhGvj4k6jzRnqasNKIeoh5gI7BJaC1A1AoNBjJgbyApVS4IDlZgDU5WUAxEKDNmmALHzZp0Fkz1FMTmGFl1FMEyodIavcCAUHDWrKAIA4aa2oCgILEBupZgHvAhEBcZ6joQBxS76AgccrFlczBvKLC0QI2cBoCFvfTDAo7eoOQInqDPBtvrDEZBNYN5xwNwxQRfw8ZQ5wQVLvO8OYU+mHvFLlDh05Mdg7BT6YrRPpCBznMB2r//xKJjyyOh+cImr2/4doscwD6neZjuZR4AgAABYAAAABy1xcdQtxYBYYZdifkUDgzzXaXn98Z0oi9ILU5mBjFANmRwlVJ3/6jYDAmxaiDG3/6xjQQCCKkRb/6kg/wW+kSJ5//rLobkLSiKmqP/0ikJuDaSaSf/6JiLYLEYnW/+kXg1WRVJL/9EmQ1YZIsv/6Qzwy5qk7/+tEU0nkls3/zIUMPKNX/6yZLf+kFgAfgGyLFAUwY//uQZAUABcd5UiNPVXAAAApAAAAAE0VZQKw9ISAAACgAAAAAVQIygIElVrFkBS+Jhi+EAuu+lKAkYUEIsmEAEoMeDmCETMvfSHTGkF5RWH7kz/ESHWPAq/kcCRhqBtMdokPdM7vil7RG98A2sc7zO6ZvTdM7pmOUAZTnJW+NXxqmd41dqJ6mLTXxrPpnV8avaIf5SvL7pndPvPpndJR9Kuu8fePvuiuhorgWjp7Mf/PRjxcFCPDkW31srioCExivv9lcwKEaHsf/7ow2Fl1T/9RkXgEhYElAoCLFtMArxwivDJJ+bR1HTKJdlEoTELCIqgEwVGSQ+hIm0NbK8WXcTEI0UPoa2NbG4y2K00JEWbZavJXkYaqo9CRHS55FcZTjKEk3NKoCYUnSQ0rWxrZbFKbKIhOKPZe1cJKzZSaQrIyULHDZmV5K4xySsDRKWOruanGtjLJXFEmwaIbDLX0hIPBUQPVFVkQkDoUNfSoDgQGKPekoxeGzA4DUvnn4bxzcZrtJyipKfPNy5w+9lnXwgqsiyHNeSVpemw4bWb9psYeq//uQZBoABQt4yMVxYAIAAAkQoAAAHvYpL5m6AAgAACXDAAAAD59jblTirQe9upFsmZbpMudy7Lz1X1DYsxOOSWpfPqNX2WqktK0DMvuGwlbNj44TleLPQ+Gsfb+GOWOKJoIrWb3cIMeeON6lz2umTqMXV8Mj30yWPpjoSa9ujK8SyeJP5y5mOW1D6hvLepeveEAEDo0mgCRClOEgANv3B9a6fikgUSu/DmAMATrGx7nng5p5iimPNZsfQLYB2sDLIkzRKZOHGAaUyDcpFBSLG9MCQALgAIgQs2YunOszLSAyQYPVC2YdGGeHD2dTdJk1pAHGAWDjnkcLKFymS3RQZTInzySoBwMG0QueC3gMsCEYxUqlrcxK6k1LQQcsmyYeQPdC2YfuGPASCBkcVMQQqpVJshui1tkXQJQV0OXGAZMXSOEEBRirXbVRQW7ugq7IM7rPWSZyDlM3IuNEkxzCOJ0ny2ThNkyRai1b6ev//3dzNGzNb//4uAvHT5sURcZCFcuKLhOFs8mLAAEAt4UWAAIABAAAAAB4qbHo0tIjVkUU//uQZAwABfSFz3ZqQAAAAAngwAAAE1HjMp2qAAAAACZDgAAAD5UkTE1UgZEUExqYynN1qZvqIOREEFmBcJQkwdxiFtw0qEOkGYfRDifBui9MQg4QAHAqWtAWHoCxu1Yf4VfWLPIM2mHDFsbQEVGwyqQoQcwnfHeIkNt9YnkiaS1oizycqJrx4KOQjahZxWbcZgztj2c49nKmkId44S71j0c8eV9yDK6uPRzx5X18eDvjvQ6yKo9ZSS6l//8elePK/Lf//IInrOF/FvDoADYAGBMGb7FtErm5MXMlmPAJQVgWta7Zx2go+8xJ0UiCb8LHHdftWyLJE0QIAIsI+UbXu67dZMjmgDGCGl1H+vpF4NSDckSIkk7Vd+sxEhBQMRU8j/12UIRhzSaUdQ+rQU5kGeFxm+hb1oh6pWWmv3uvmReDl0UnvtapVaIzo1jZbf/pD6ElLqSX+rUmOQNpJFa/r+sa4e/pBlAABoAAAAA3CUgShLdGIxsY7AUABPRrgCABdDuQ5GC7DqPQCgbbJUAoRSUj+NIEig0YfyWUho1VBBBA//uQZB4ABZx5zfMakeAAAAmwAAAAF5F3P0w9GtAAACfAAAAAwLhMDmAYWMgVEG1U0FIGCBgXBXAtfMH10000EEEEEECUBYln03TTTdNBDZopopYvrTTdNa325mImNg3TTPV9q3pmY0xoO6bv3r00y+IDGid/9aaaZTGMuj9mpu9Mpio1dXrr5HERTZSmqU36A3CumzN/9Robv/Xx4v9ijkSRSNLQhAWumap82WRSBUqXStV/YcS+XVLnSS+WLDroqArFkMEsAS+eWmrUzrO0oEmE40RlMZ5+ODIkAyKAGUwZ3mVKmcamcJnMW26MRPgUw6j+LkhyHGVGYjSUUKNpuJUQoOIAyDvEyG8S5yfK6dhZc0Tx1KI/gviKL6qvvFs1+bWtaz58uUNnryq6kt5RzOCkPWlVqVX2a/EEBUdU1KrXLf40GoiiFXK///qpoiDXrOgqDR38JB0bw7SoL+ZB9o1RCkQjQ2CBYZKd/+VJxZRRZlqSkKiws0WFxUyCwsKiMy7hUVFhIaCrNQsKkTIsLivwKKigsj8XYlwt/WKi2N4d//uQRCSAAjURNIHpMZBGYiaQPSYyAAABLAAAAAAAACWAAAAApUF/Mg+0aohSIRobBAsMlO//Kk4soosy1JSFRYWaLC4qZBYWFRGZdwqKiwkNBVmoWFSJkWFxX4FFRQWR+LsS4W/rFRb/////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////VEFHAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAU291bmRib3kuZGUAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMjAwNGh0dHA6Ly93d3cuc291bmRib3kuZGUAAAAAAAAAACU=");
        snd.play();
    }

    static nextID() {
        return "ID-" + Utils.count++;
    }

    static replaceHTML(id, elm, template, rplObj) {
        if (!id)
            id = Utils.nextID();
        rplObj.id = id;
        const newHTML = Utils.tagReplace(template, rplObj);
        elm.replaceWith(newHTML);
        const jqObj = $('#' + id);
        const newElm = jqObj[0];
        if (!newElm) {
            console.log(elm[0].localName + ' is missing an ID');
            return undefined;
        }
        newElm.kiss = {};
        newElm.kiss.jqObj = jqObj;
        newElm.kiss.elementInfo = {};
        return newElm.kiss;
    }

    static getHTML(url) {
        return new Promise(async function (resolve, reject) {
            let response;
            try {
                response = await fetch(url + (Utils.controlCache ? '?ver=' + Utils.softwareVersion : ''), {
                    method: 'GET',
                    headers: {
                        'Content-type': 'text/plain'
                    }
                });
            } catch (err) {
                console.log(err.message);
                console.log(err.stack);
                reject(err);
                return;
            }
            try {
                let r = await response.text();
                resolve(r);
            } catch (err) {
                console.log(err.message);
                console.log(err.stack);
                reject(err);
            }
        });
    };

    /**
     * Loads a new HTML/JS page.  The new page will replace the body of the current page.
     * Also, the loaded code is processed for custom tags / components.
     * <br><br>
     * <code>.html</code> and <code>.js</code> are appended to <code>page</code> to determine what to load.
     * The HTML file is loaded first and then the JS file.
     *
     * @param {string} page path to the page to be loaded
     * @param {string} tag optional ID of div to fill (if empty, "body" tag is used)
     * @param {string} initialFocus optional, ID of control to set initial focus on
     * @param {object} argv arguments for the page being loaded
     * @param {object} retv return value array from child screen (mainly used internally)
     *
     * @see Utils.pushPage
     * @see Utils.popPage
     * @see Utils.getPageArgv
     * @see Utils.getPageRetv
     */
    static loadPage(page, tag, initialFocus, argv, retv) {
        return new Promise(function (resolve, reject) {
            Utils.cleanup();
            Utils.lastScreenLoaded.page = page;
            Utils.lastScreenLoaded.tag  = tag;
            Utils.lastScreenLoaded.initialFocus = initialFocus;
            Utils.lastScreenLoaded.argv  = argv;
            Utils.lastScreenLoaded.retv = retv;
            Utils.getHTML(page + '.html').then(function (text) {
                if (tag)
                    $('#' + tag).html(text);
                else
                    $('body').html(text);
                Utils.rescan();  // does all the tag replacement
                window.scrollTo(0, 0);
                getScript(page + '.js').then(function () {
                    if (initialFocus) {
                        const ctl = $$(initialFocus);
                        if (ctl)
                            ctl.focus();
                        else
                            console.log("loadPage: can't set focus to unknown field " + initialFocus);
                    }
                    resolve();
                }, function () {
                    reject();
                });
            }, function(err) {
                console.log("loadPage: error loading " + pg);
                reject();
            });
        });
    }

    /**
     * Load a new screen but also remember what is loaded so that it can be returned to.
     *
     * @param {string} page path to the page to be loaded
     * @param {string} tag optional ID of div to fill (if empty, "body" tag is used)
     * @param {string} initialFocus optional, ID of control to set initial focus on
     * @param {object} argv values being passed to the new screen
     *
     * @see Utils.popPage
     * @see Utils.getPageArgv
     * @see Utils.getPageRetv
     * @see Utils.loadPage
     */
    static pushPage(page, tag, initialFocus, argv) {
        //  push the previous screen with args
        const stackFrame = {
            path: Utils.lastScreenLoaded.page,
            tag: Utils.lastScreenLoaded.tag,
            initialFocus: Utils.initialFocus,
            argv: Utils.lastScreenLoaded.argv
        };
        Utils.screenStack.push(stackFrame);
        Utils.loadPage(page, tag, initialFocus, argv);
    }

    /**
     * Re-load the prior screen.
     *
     * @param {object} retv values being returned to the prior screen
     * @param {number} howmany how many screens to go back (default 1)
     *
     * @see Utils.pushPage
     * @see Utils.getPageArgv
     * @see Utils.getPageRetv
     */
    static popPage(retv, howmany=1) {
        let stackFrame;
        while (howmany--) {
            if (!Utils.screenStack.length) {
                console.log("Utils.popPage:  no screen to pop");
                return;
            }
            stackFrame = Utils.screenStack.pop();
        }
        Utils.loadPage(stackFrame.path, stackFrame.tag, stackFrame.initialFocus, stackFrame.argv, retv);
    }

    /**
     * Convert an object into an array.  This is especially useful for the <code>arguments</code> variable.
     *
     * @param obj
     * @returns {array}
     */
    static convertToArray(obj) {
        const a = [];
        for (let i=0 ; i < obj.length ; i++)
            a.push(obj[i]);
        return a;
    }

    /**
     * Returns an object representing the values passed to the current screen by a parent screen.
     * <br><br>
     * This value remains constant through subsequent <code>pushPage</code> and <code>popPage</code> calls.
     *
     * @returns {object}
     *
     * @see Utils.pushPage
     * @see Utils.popPage
     * @see Utils.getPageRetv
     */
    static getPageArgv() {
        return Utils.lastScreenLoaded.argv;
    }

    /**
     * Returns an object representing the return value from the child screen.
     *
     * @returns {object}
     *
     * @see Utils.pushPage
     * @see Utils.popPage
     * @see Utils.getPageArgv
     */
    static getPageRetv() {
        return Utils.lastScreenLoaded.retv;
    }

    /**
     * Is the user's computer connected to the Internet?
     *
     * @returns {boolean}
     */
    static isOnline() {
        //return false;          //  used to simulate off-line condition
        return navigator.onLine;
    }

    /**
     * Create a new UUID.
     *
     * @returns {string}
     */
    static uuid() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    }

    /**
     * Open an embedded or external modal popup window identified by id <code>id</code>.
     *
     * An embedded popup is one in which the HTML is defined in the main screen and the JavaScript is
     * defined along with the JavaScript for the main screen.  An external popup is one in which the
     * HTML and JavaScript for the popup is defined in external files.  If in external files, the
     * two files must have the same name except that one ends in ".html" and the other ends in ".js".
     *
     * If file_name is given, it is treated as the base file name for the HTML and JS files that define
     * the popup.  If file_name is null, the popup is assumed to be a popup embedded in the HTML page.
     *
     * @param {*} file_name the name of the file holding the popup screen and JavaScript (without a file extension) or null
     * @param {string} id the id of the popup to evoke
     * @param {object} in_data the data passed to the popup
     * @param {function} init_function init function used on embedded popups or undefined or null for external popups
     *
     * @see Utils.popup_close1
     *
     * @deprecated
     *
     * THIS METHOD IS DEPRECATED.  USE Utils.popup_open() INSTEAD.
     */
    static popup_open1(file_name, id, in_data = null, init_function = null) {

        return new Promise(function (resolve, reject) {
            if (typeof AGGrid !== 'undefined')
                AGGrid.newGridContext();
            if (typeof Editor !== 'undefined')
                Editor.newEditorContext();
            PopupResolveStack.push(resolve);
            let modal = document.getElementById(id);

            let setup = function (modal) {
                if (!modal)
                    modal = document.getElementById(id);
                let modalContent;
                // Find the child element with the class 'modal-content'.
                for (let childNode of modal.children) {
                    let classes = childNode.className !== undefined ? childNode.className.split(" ") : [];

                    if (classes.includes('modal-content')) {
                        modalContent = childNode;
                        break;
                    }
                }

                if (modalContent) {
                    let modalTitle;

                    // Find the child element with the class 'modal-title'.
                    for (let childNode of modalContent.children) {
                        let classes = childNode.className !== undefined ? childNode.className.split(" ") : [];

                        if (classes.includes('modal-title')) {
                            modalTitle = childNode;
                            break;
                        }
                    }

                    // Make dialog draggable.
                    if (modalTitle)
                        Utils.dragModal(modalContent, modalTitle);

                    // Removed due to the ambiguous appearance to the user.
                    // // Add a close button.
                    // if (modalTitle != null)
                    //     utils.addCloseButton(modal, modalTitle);

                    // Round up CSS transformations to get a crispier dialog.
                    Utils.roundCssTransformMatrix(modalContent.id);
                }

                modal.style.zIndex = Utils.popup_zindex++;
                modal.hidden = false;

                if (file_name)
                    Component[file_name].run(in_data);
                else if (init_function)
                    init_function(in_data);
            };
            if (!modal) {

                let loadJS = function (url, implementationCode) {
                    let head = document.getElementsByTagName("head")[0];
                    let scriptTag = document.createElement('script');
                    scriptTag.src = url;
                    scriptTag.onload = implementationCode;
                    scriptTag.onreadystatechange = implementationCode;
                    head.appendChild(scriptTag);
                };

                // screen hasn't been loaded yet.  Load new.
                httpGet(`${Framework.lastLoadedScreen.substring(0, Framework.lastLoadedScreen.lastIndexOf("/"))}/${file_name}.html?ver=${Utils.softwareVersion}`, html => {
                    Utils.appendToBody(html);
                    ActivePopups.push(id);
                    loadJS(`${Framework.lastLoadedScreen.substring(0, Framework.lastLoadedScreen.lastIndexOf("/"))}/${file_name}.js?ver=${Utils.softwareVersion}`, () => {
                        setup(modal);
                    });
                });
            } else {
                setup(modal);
            }
        });
    }

    /**
     * Close an embedded or external modal popup.
     *
     * @param {string} id the id of the popup to close
     * @param {object} return_value the value returned from the popup
     *
     * @deprecated
     *
     * @see Utils.popup_open1
     */
    static popup_close1(id, return_value = null) {
        const resolve = PopupResolveStack.pop();
        const modal = document.getElementById(id);
        Utils.popup_zindex--;
        if (Utils.popup_zindex < 10)
            Utils.popup_zindex = 10;

        modal.hidden = true;
        if (typeof AGGrid !== 'undefined')
            AGGrid.popGridContext();
        if (typeof Editor !== 'undefined')
            Editor.popEditorContext();
        Utils.popEnterContext();
        resolve(return_value);
    }

    /**
     * Make an HTML DOM modalContainer draggable.
     *
     * @param modalContainer Modal container to be made draggable.
     * @param header Header element of the modalContainer.
     */
    static dragModal(modalContainer, header) {
        let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

        // If header is present drag from the header.
        if (header) {
            header.onmousedown = dragMouseDown;
        } else {
            modalContainer.onmousedown = dragMouseDown;
        }

        /**
         * Handle mouse down event.
         *
         * @param e DOM event.
         */
        function dragMouseDown(e) {
            e = e || window.event;
            e.preventDefault();

            // Startup mouse cursor position.
            pos3 = e.clientX;
            pos4 = e.clientY;
            document.onmouseup = closeDragElement;

            // Drag the element whenever the mouse moves.
            document.onmousemove = dragElement;
        }

        /**
         * Handle mouse move event.
         *
         * @param e DOM event.
         */
        function dragElement(e) {
            e = e || window.event;
            e.preventDefault();

            // New mouse cursor position.
            pos1 = pos3 - e.clientX;
            pos2 = pos4 - e.clientY;
            pos3 = e.clientX;
            pos4 = e.clientY;

            // Set the modalContainer's new position.
            modalContainer.style.top = (modalContainer.offsetTop - pos2) + "px";
            modalContainer.style.left = (modalContainer.offsetLeft - pos1) + "px";
        }

        /**
         * Stop moving when the mouse button is released.
         */
        function closeDragElement() {
            document.onmouseup = null;
            document.onmousemove = null;
        }
    }

    /**
     * Adds a close button to the modal dialog.
     *
     * @param modal Modal dialog to modify.
     * @param titleBar Title bar of the modal.
     *
     * @deprecated
     */
    static addCloseButton(modal, titleBar) {
        const closeButton = document.createElement("span");
        closeButton.innerText = "X";
        closeButton.classList.add("close");
        titleBar.appendChild(closeButton);

        closeButton.addEventListener("click", () => {
            Utils.popup_close1(modal.id);
        });
    }

    /**
     * This makes a window draggable.
     *
     * @param header jQuery object
     * @param content jQuery object
     */
    static makeDraggable(header, content) {

        function handle_mousedown(e)
        {
            const body = $('body');
            const drag = {};

            drag.pageX0 = e.pageX;
            drag.pageY0 = e.pageY;
            drag.elem = content;
            drag.offset0 = $(this).offset();

            function handle_dragging(e) {
                const left = drag.offset0.left + (e.pageX - drag.pageX0);
                const top = drag.offset0.top + (e.pageY - drag.pageY0);
                $(drag.elem)
                    .offset({top: top, left: left});
            }

            function handle_mouseup(e) {
                body
                    .off('mousemove')
                    .off('mouseup');
            }

            body.on('mouseup', handle_mouseup)
                .on('mousemove', handle_dragging);
        }

        // for mobile devices
        function handle_touchstart(e)
        {
            const body = $('body');
            const drag = {};

            e.preventDefault();

            drag.pageX0 = e.originalEvent.touches[0].clientX;
            drag.pageY0 = e.originalEvent.touches[0].clientY;

            drag.elem = content;
            drag.offset0 = $(this).offset();

            function handle_dragging(e) {
                const left = drag.offset0.left + (e.originalEvent.touches[0].clientX - drag.pageX0);
                const top = drag.offset0.top + (e.originalEvent.touches[0].clientY - drag.pageY0);
                $(drag.elem)
                    .offset({top: top, left: left});
            }

            function handle_mouseup(e) {
                body
                    .off('touchmove')
                    .off('touchend');
            }

            body
                .on('touchmove', handle_dragging)
                .on('touchend', handle_mouseup);
        }
        header.css('cursor', 'all-scroll');
        header.on('mousedown', handle_mousedown);
        header.on('touchstart', handle_touchstart);
    }

    /**
     * Open a modal popup window identified by id <code>id</code>.
     * <br><br>
     * If <code>replace</code> is used and there isn't a prior popup, it just acts like a plain open.
     * So, if the popup is being used as a wizard, all the opens should set this to <code>true</code>.
     *
     * @param {string} id the id of the popup to evoke
     * @param {string} focus_ctl optional, control to set initial focus
     * @param {boolean} replace optional, if true, replace prior popup with this popup at the same coordinates
     *
     * @see Utils.popup_close
     */
    static popup_open(id, focus_ctl=null, replace = false) {
        const w = $('#' + id);
        if (!w.length) {
            console.log(`Popup ${id} not found.`);
            throw new Error(`Popup ${id} not found.`);
        } else if (w.length > 1) {
            console.log(`Popup ${id} found more than once.`);
            throw new Error(`Popup ${id} found more than once.`);
        }

        let prior_offset = null;

        if (replace && Utils.popup_context.length) {
            const prior_context = Utils.popup_context[Utils.popup_context.length - 1];
            const prior_id = prior_context.id;
            const prior_w = $('#' + prior_id);
            const prior_content = prior_w.children();
            prior_offset = $(prior_content).offset();
            Utils.popup_close();
        }

        let content;
        let both_parts;
        let header;
        let body;

        Utils.popup_context.push({
            id: id,
            globalEnterHandler: Utils.globalEnterHandler(null)
        });
        if (typeof AGGrid !== 'undefined')
            AGGrid.newGridContext();
        if (typeof Editor !== 'undefined')
            Editor.newEditorContext();
        Utils.newEnterContext();
        if (!w.hasClass('popup-background')) {
            let width = w.css('width');
            let height = w.css('height');
            w.addClass('popup-background');
            w.css('z-index', Utils.popup_zindex++);
            w.css('width', '100%');
            w.css('height', '100%');
            w.wrapInner('<div></div>');
            content = w.children();
            content.addClass('popup-content');
            content.css('z-index', Utils.popup_zindex++);
            content.attr('id', id + '--width');

            both_parts = content.children();
            header = both_parts.first();
            header.addClass('popup-header');
            body = header.next();
            body.addClass('popup-body');
            body.attr('id', id + '--height');
            content.css('width', width);
            body.css('height', height);
        } else {
            w.css('z-index', Utils.popup_zindex++);
            content = w.children();
            content.css('z-index', Utils.popup_zindex++);
            both_parts = content.children();
            header = both_parts.first();
            body = header.next();
        }

        w.show();
        if (prior_offset)
            $(content).offset(prior_offset);

        this.makeDraggable(header, content);

        if (focus_ctl) {
            const fctl = $('#' + focus_ctl);
            if (fctl.length)
                fctl.focus();
            else
                console.log("popup_open:  can't set focus to non-existent field " + focus_ctl);
        } else {
            const ctl = $(':focus');
            if (ctl)
                ctl.blur();
        }
    }

    /**
     * Dynamically change the height of a popup.
     * Only works after a popup is open.
     *
     * @param {string} id popup id
     * @param {string} height  like "200px"
     */
    static popup_set_height(id, height) {
        const ctl = $('#' + id + '--height');
        if (ctl.length)
            ctl.css('height', height);
        else
            console.log("Utils.popup_set_height:  can't set height before popup " + id + " is open");
    }

    /**
     * Dynamically change the width of a popup.
     * Only works after a popup is open.
     *
     * @param {string} id popup id
     * @param {string} width  like "200px"
     */
    static popup_set_width(id, width) {
        const ctl = $('#' + id + '--width');
        if (ctl.length)
            ctl.css('width', width);
        else
            console.log("Utils.popup_set_width:  can't set width before popup " + id + " is open");
    }

    /**
     * Close the most recent modal popup.
     *
     * @see Utils.popup_open
     */
    static popup_close() {
        const context = Utils.popup_context.pop();
        if (!context) {
            console.log('popup_close called without an active popup');
            return;
        }
        if (typeof AGGrid !== 'undefined')
            AGGrid.popGridContext();
        if (typeof Editor !== 'undefined')
            Editor.popEditorContext();
        Utils.popEnterContext();
        $('#' + context.id).hide();
        Utils.globalEnterHandler(context.globalEnterHandler);
        Utils.popup_zindex -= 2;
        if (Utils.popup_zindex < 10)
            Utils.popup_zindex = 10;
    }

    /**
     * Open and use a component popup
     *
     * @param fname {string} the file name
     * @param tag {string} the ID of the popup
     * @param indata {object} input data
     * @returns {Promise<Object>} the return data
     */
    static component(fname, tag, indata=null) {
        return new Promise(function (resolve, reject) {
            $.ajax({
                url: 'screens/components/' + fname + '.html',
                dataType: 'html',
                cache: true,
                success: function (data, status, jqXHR) {
                    $('#data-pane').append(data);
                    // Does all the tag replacement.
                    Utils.rescan();

                    getScript('screens/components/' + fname + '.js').then(function () {
                        let fun = window.popup_startup;
                        delete window.popup_startup;

                        Utils.popup_open(tag);

                        fun(indata).then(function (outdata) {
                            Utils.popup_close(tag);
                            let elm = document.getElementById(tag);
                            elm.parentNode.removeChild(elm);
                            resolve(outdata);
                        });
                    });
                },
                error: function (jqXHR, textStatus, error) {
                    Utils.showMessage('Error', 'Error communicating with the server.');
                    reject({status: 'error', message: textStatus});
                }
            });
        });
    }

    /**
     * Return the number of files the user selected for upload.
     *
     * @param {string} id the id of the control
     * @returns {number}
     *
     * @see Server.fileUploadSend
     * @see Utils.getFileUploadFormData
     */
    static getFileUploadCount(id) {
        const ctl = $('#' + id);
        const file_list = ctl.get(0).files;
        return file_list.length;
    }

    /**
     * Creates and initializes a FormData instance used for file uploading.
     * Before the FormData instance is sent, arbitrary additional data may be added
     * by using <code>fd.append(name, data)</code>
     * <br><br>
     * where <code>fd</code> is the object return by this call.
     *
     * @param {string} id the id of the control
     * @returns {FormData}
     *
     * @see Server.fileUploadSend
     * @see Utils.getFileUploadCount
     */
    static getFileUploadFormData(id) {
        const ctl = $('#' + id);
        const file_list = ctl.get(0).files;
        const data = new FormData();
        for (let i = 0; i < file_list.length; i++)
            data.append('_file-' + i, file_list[i]);
        return data;
    }

    /**
     * Converts a potentially non-ASCII string to ASCII.
     *
     * @param str
     * @returns {str}
     */
    static toASCII(str) {
        if (!str)
            return str;
        str = str.normalize("NFD").replace(/[\u0300-\u036f]/g, ""); // first, try to remove accents
        return str.replace(/[^\x00-\x7F]/g, ""); // then, remove any remaining non-ASCII characters
    }

    /**
     * Displays a report given a URL from the back-end.
     * Correctly handles dual server development situations.
     *
     * @param url {string} report url
     */
    static showReport(url) {
        let path;
        if (url.charAt(0) !== '/')
            url = '/' + url;
        if (window.location.href.search("localhost:8000") !== -1 ||
            window.location.href.search("localhost:8001") !== -1 ||
            window.location.href.search("localhost:8002") !== -1 ||
            window.location.href.search("localhost:63342") !== -1 ||
            window.location.href.search("localhost:63340") !== -1) // if debugging with a local server
            path = "http://localhost:8080" + url;
        else {
            const server = Server.url;
            let ns = 0;  //  number of slashes
            let ts = 0;  //  index of third slash
            for (let i=0 ; i < server.length ; i++)
                if (server.charAt(i) === '/')
                    if (++ns === 3) {
                        ts = i;
                        break;
                    }
            path = ts ? server.substr(ts) + url : url;
        }
        window.open(path, "_blank");
    }

    /**
     * Rounds up translation matrices to integer values to remove blurring that occurs on webkit browsers.
     *
     * @param element Element the translation will be applied to.
     */
    static roundCssTransformMatrix(element) {
        const el = document.getElementById(element);

        // Resets the redefined matrix to allow recalculation, the original style should be defined in the class not inline.
        el.style.transform = "";

        // Gets the current computed style.
        const mx = window.getComputedStyle(el, null);

        const propVal = mx.getPropertyValue("transform") || false;
        const values = propVal.replace(/ |\(|\)|matrix/g, "").split(",");
        for (let v in values) {
            values[v] = v > 4 ? Math.ceil(Number(values[v])) : values[v];
        }

        $("#" + element).css({transform: "matrix(" + values.join() + ")"});
    }

    /**
     * Append a given HTML string to the body of the document.
     *
     * @param data HTML string containing the element.
     */
    static appendToBody(data) {
        const frag = document.createRange().createContextualFragment(data);
        const elem = document.getElementById(frag.firstElementChild.id);
        if (elem === null) {
            document.body.append(frag);

            this.rescan();
        }
    }

    /**
     * Removes an element and its children from DOM. Can be used to remove dynamically loaded content from the page.
     * Make sure to execute any exit functionality before calling this method.
     *
     * @param id ID of the element to remove.
     */
    static removeFromDOM(id) {
        const elem = document.getElementById(id);
        elem.parentNode.removeChild(elem);
    }

    // /**
    //  * Sets the filter property for SSN fields. Please note that this function overrides the onChange event handler of the element.
    //  *
    //  * @param inputId Id of the input element.
    //  */
    // static setSSNFilter(inputId) {
    //     let ssnInput = document.getElementById(inputId);
    //     setInputFilter(inputId, value => {
    //         return /^\d*$/.test(value) && Number(value) <= 999999999;
    //     });
    //
    //     let onSSNChange = () => {
    //         let ssnVal = $$(inputId).getValue();
    //         ssnVal.replace(/\D/g, '');
    //         ssnInput.value = formatSSN(Number(ssnVal));
    //     };
    //
    //     ssnInput.addEventListener('change', onSSNChange);
    // }

    /**
     * Check whether the element is visible.
     *
     * @param id Element ID
     * @returns {boolean}
     */
    static isVisible(id) {
        const el = document.getElementById(id);
        const style = window.getComputedStyle(el);
        return (style.display !== 'none');
    }

    /**
     * Toggle password mask on and off in an input.
     *
     * @param inputId Input element ID.
     * @param visible Whether the password should be visible.
     */
    static togglePwdVisibility(inputId, visible) {
        const input = document.getElementById(inputId);

        if (visible) {
            if (input.type === 'password') {
                input.type = 'text';
            }
        } else {
            if (input.type === 'text') {
                input.type = 'password';
            }
        }
    }

    static makeName(fn, mn, ln) {
        let name = ln ? ln : "";
        if (fn || mn)
            name += ", ";
        if (fn)
            name += fn;
        if (mn) {
            if (fn)
                name += " ";
            name += mn;
        }
        return name;
    }

    /**
     * Change a given element (label) to reflect the dirty status of the current screen.
     *
     * @param id Label ID.
     * @param isDirty Whether the screen is dirty.
     */
    static changeDirtyStatus(id, isDirty) {
        let endsWithUnsaved = false;
        const element = document.getElementById(id);
        const labelString = element.innerText;
        const unsavedMsg = "(unsaved changes)";

        if (labelString.length > unsavedMsg.length) {
            endsWithUnsaved = labelString.lastIndexOf(unsavedMsg, (labelString.length - unsavedMsg.length)) !== -1;
        }

        if (isDirty) {
            if (!element.classList.contains('error-label')) {
                element.classList.add('error-label');
            }

            if (!endsWithUnsaved) {
                element.innerText += unsavedMsg;
            }
        } else {
            if (element.classList.contains('error-label')) {
                element.classList.remove('error-label');
            }

            if (endsWithUnsaved) {
                element.innerText = element.innerText.substr(0, (labelString.length - unsavedMsg.length));
            }
        }
    }

    /**
     * Set the inner text value of an HTML element.
     *
     * @deprecated
     * Rather than using this, use a Kiss text-label tag and setValue().
     *
     * @param id ID of the element.
     * @param text The new text value.
     */
    static setText(id, text) {
        try {
            document.getElementById(id).innerText = text;
        } catch (e) {
            console.log(`Cannot change element text: ${e}`);
        }
    }

    /***
     * Get the inner text value of an HTML element.
     *
     * @param id ID of the element.
     * @returns {string|undefined} Inner text value of the element.
     */
    static getText(id) {
        try {
            return document.getElementById(id).innerText;
        } catch (e) {
            console.log(`Cannot read element text: ${e}`);
            return undefined;
        }
    }

    /**
     * Set the inner HTML value of an HTML element.
     *
     * @param id ID of the element.
     * @param text The new text value.
     */
    static setHTML(id, text) {
        try {
            document.getElementById(id).innerHTML = text;
        } catch (e) {
            console.log(`Cannot change element HTML: ${e}`);
        }
    }

    //--------------------------

    /**
     * Returns true if the key hit is the kind of keyboard character that changes the value.
     * (Textarea will need to check 'Enter' too.)
     *
     * @param event
     * @returns {boolean}
     */
    static isChangeChar(event) {
        if (!event || !event.key)
            return false;
        return !(event.ctrlKey && event.key !== 'v') && (event.key.length === 1 || event.key === 'Backspace' || event.key === 'Delete');
    }

    /**
     * The whole watching of control value changes can be controlled by this function.
     * Since it returns the previous value, this function can be used to temporarily suspend
     * detection of changes and then re-enable them.
     *
     * @param flg
     * @returns {boolean}
     */

    static watchControlValueChanges(flg) {
        const prev = Utils.watchContolValueChangesFlag;
        Utils.watchContolValueChangesFlag = flg;
        return prev;
    }

    /**
     * This function is called to indicate to the system that <em>some</em> control value changed by the user.
     * Programmatic changed to not set this.
     * It is mainly used internally as all the Kiss controls use this function.
     *
     * If there is a function connected to some-control-value-changing via the setSomeControlValueChangeFunction
     * function, it will be executed the <em>first time only</em> that any control value is changed.
     * Subsequent changes will not trigger the some-control-value-changing function.
     * The some-control-value-changing function is passed the single argument <code>true</code>.
     *
     * Non-Kiss controls should call this function if their value changes.
     *
     */
    static someControlValueChanged() {
        if (Utils.watchContolValueChangesFlag)
            if (!Utils.someControlValueChangedFlag) {
                Utils.someControlValueChangedFlag = true;
                if (Utils.someControlValueChangedFun)
                    Utils.someControlValueChangedFun(Utils.someControlValueChangedFlag);
            }
    }

    /**
     * This function clears the state of some control value having been changed.
     *
     * Also, if a function is attached (via the setSomeControlValueChangeFunction function),
     * it will be executed if some value had changed and a <code>true</code> argument is passed
     * to this function.  The some-control-value-changed function will be passed a <code>false</code>.
     *
     * @param executeFunction optional boolean
     */
    static clearSomeControlValueChanged(executeFunction = true) {
        if (Utils.watchContolValueChangesFlag)
            if (Utils.someControlValueChangedFlag) {
                Utils.someControlValueChangedFlag = false;
                if (Utils.someControlValueChangedFun && executeFunction)
                    Utils.someControlValueChangedFun(Utils.someControlValueChangedFlag);
            }
    }

    /**
     *
     * @returns {boolean} true if any control value changed, false otherwise
     */
    static didSomeControlValueChange() {
        return Utils.watchContolValueChangesFlag ? Utils.someControlValueChangedFlag : false;
    }

    /**
     * Used for setting an application specific function to be executed the first
     * time any control value is changed by the user or if the change status is cleared.
     * Other programmatic changes do not trigger this condition.
     *
     * A <code>null</code> value may be passed in order to clear the function.
     *
     * The function is passed a single boolean value.  <code>true</code> means
     * a control value has changed, and <code>false</code> if the state is
     * being reset.
     *
     * @param fun
     */
    static setSomeControlValueChangeFunction(fun) {
        const prev = Utils.someControlValueChangedFun;
        Utils.someControlValueChangedFun = fun;
        return prev;
    }

    /**
     * Count properties associated with an object.
     *
     * @param obj
     * @returns {number}
     */
    static countProperties(obj) {
        return Object.keys(obj).length;
    }

    /**
     * Perform a shallow clone on an array.
     *
     * @param ary
     * @returns { clone of ary}
     */
    static cloneArrayShallow(ary) {
        return [...ary];
    }

    /**
     * Set a global handler for the enter/return key.
     * If fun is null, the enter function is cancelled.
     *
     * @param {function} fun the new enter function handler or null
     * @return {function} the previous enter function or null if none
     */
    static globalEnterHandler(fun) {
        const prevFun = Utils.globalEnterFunction;
        Utils.globalEnterFunction = fun;
        const obj = $('body');
        obj.off('keyup');
        if (fun)
            obj.on('keyup', function (e) {
                if (e.key === 'Enter')
                    fun();
            });
        return prevFun;
    }

    /**
     * Takes a long ID (such as 00001-0000000214) and changes it into a short ID (such as 1-214).
     *
     * @param id
     * @returns {string}
     */
    static makeShortId(id) {
        if (!id)
            return '';
        const i = id.indexOf('-');
        if (i === -1)
            return '';
        return Number(id.substring(0, i)) + '-' + Number(id.substring(i+1));
    }

    /**
     * Takes a short ID (such as 1-214) and changes it into a long ID (such as 00001-0000000214).
     *
     * @param id
     * @returns {string}
     */
    static makeLongId(id) {
        if (!id)
            return '';
        const i = id.indexOf('-');
        if (i === -1)
            return '';
        return Utils.format(Number(id.substring(0, i), 'Z', 5, 0)) + '-' + Utils.format(Number(id.substring(i+1), 'Z', 10, 0));
    }

    /**
     * Perform all cleanup operations between screens
     */
    static cleanup() {
        Utils.clearSomeControlValueChanged(false);
        if (typeof Kiss !== 'undefined' && typeof Kiss.RadioButtons !== 'undefined')
            Kiss.RadioButtons.resetGroups();
        if (typeof AGGrid !== 'undefined') {
            AGGrid.popAllGridContexts();
            AGGrid.newGridContext();   //  for the new screen we are loading
        }
        if (typeof Editor !== 'undefined') {
            Editor.popAllEditorContexts();
            Editor.newEditorContext();   //  for the new screen we are loading
        }
        Utils.clearAllEnterContexts();
        Utils.newEnterContext();
        Utils.globalEnterHandler(null);
        Utils.popup_context = [];
        const ctl = $(':focus');   // remove any focus
        if (ctl)
            ctl.blur();
    }

    /**
     * Create a new enter key context.
     */
    static newEnterContext() {
        Utils.enterFunctionStack.push(Utils.enterFunction);
        Utils.enterFunction = null;
    };

    /**
     * Destroy all grids in last context and remove the context
     */
    static popEnterContext() {
        if (Utils.enterFunctionStack.length)
            Utils.enterFunction = Utils.enterFunctionStack.pop();
        else
            Utils.enterFunction = null;
    };

    /**
     * Clear all enter key contexts that have been created
     */
    static clearAllEnterContexts() {
        Utils.enterFunction = null;
        Utils.enterFunctionStack = [];
    };

    /**
     * Function to execute if the user hits the enter key
     *
     * @param fun
     */
    static setEnterFunction(fun) {
        Utils.enterFunction = fun;
    }

    /**
     * Converts a text string into a string suitable to HTML.
     *
     * @param text
     * @returns {string}
     */
    static textToHtml(text) {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&apos;")
            .replace(/\n/g, '<br>')
//            .replace(/ /g, '&nbsp;')  kills text wrapping
            ;
    }

    /**
     * Convert an HTML string into a text string.
     * Also convert Unicode to ASCII when possible.
     *
     * @param html
     * @returns {string}
     */
    static htmlToText(html) {
        if (!html)
            return '';
        return html
            .replace(/<br *[^>]*>/g, '\n')

            // iPhone uses Unicode!  Convert to ASCII.
            .replace(/\u2018/g, "'")
            .replace(/\u2019/g, "'")
            .replace(/\u201B/g, "'")
            .replace(/\u201C/g, '"')
            .replace(/\u201F/g, '"')
            .replace(/\u201D/g, '"')
            .replace(/\u275D/g, '"')
            .replace(/\u275E/g, '"')
            .replace(/\u301D/g, '"')
            .replace(/\u301E/g, '"')
            .replace(/\u275B/g, "'")
            .replace(/\u275C/g, "'")

            .replace(/<div *[^>]*>/g, '\n')
            .replace(/<\/div>/g, '')
            .replace(/<span *[^>]*>/g, '')
            .replace(/<\/span>/g, '')
            .replace(/<h1 *[^>]*>/g, '')
            .replace(/<\/h1>/g, '')
            .replace(/<font *[^>]*>/g, '')
            .replace(/<\/font>/g, '')
            .replace(/<[ap] *[^>]*>/g, '')
            .replace(/<\/[ap]>/g, '')
            // these need to be last
            .replace(/&sp;/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&apos;/g, "'")
            ;
    }

    /**
     * Dynamically set the height of the grid.  Supports resizing.  Use of this method rather than a CSS calc is due
     * to the possibility of something in the top or bottom parts wrapping on narrow widths.  This method supports that.
     *
     * For this to work, it is expected that the following tags be places in the HTML file:
     *
     * <div id="screen-start"></div>
     * <div id="grid" style="margin-top: 5px; width: 100%;"></div>
     * <div id="bottom-start"></div>
     * <div id="bottom-end" style="clear: both;"></div>
     * <div id="screen-end" style="position: absolute; bottom: 0;">&nbsp;</div>
     *
     * The JavaScript code would then make a call similar to the following:
     *
     *    Utils.setGridHeight('screen-start', 'grid', 'bottom-start', 'bottom-end', 'screen-end');
     *
     * @param screenStartID
     * @param gridID
     * @param bottomStartID
     * @param bottomEndID
     * @param screenEndID
     */
    static setGridHeight(screenStartID, gridID, bottomStartID, bottomEndID, screenEndID) {

        // Relative to the browser window
        function getWindowRect(id) {
            return document.getElementById(id).getBoundingClientRect();
        }

        function getYPos(id) {
            return document.getElementById(id).offsetTop;
        }

        function dynamicMiddleHeight() {
            const screenStartPos = getWindowRect(screenStartID).top;
            const screenEndPos = getWindowRect(screenEndID).bottom;
            const gridPos = getWindowRect(gridID).top;
            const bottomStartPos = getWindowRect(bottomStartID).top;
            const bottomEndPos = getWindowRect(bottomEndID).bottom;
            const allHeight = screenEndPos - screenStartPos - 10;  // 10 is the margin at the bottom
            const topHeight = gridPos - screenStartPos;
            const bottomHeight = bottomEndPos - bottomStartPos;
            const gridHeight = allHeight - topHeight - bottomHeight;
            const elm = document.getElementById(gridID);
            elm.style.height = gridHeight + 'px';
        }
        dynamicMiddleHeight();
        window.onresize = dynamicMiddleHeight;
    }

    /**
     * Create a marker relative to the data pane.
     * The top of the tag is the location specified.
     *
     * @param r row number
     */
    static createAbsoluteNode(r) {
        const dataPane = document.getElementById('data-pane');
        let node = document.createElement('div');
        node.innerText = '-' + r + '-';
        node.style.position = 'absolute';
        node.style.top = r + 'px';
        node.style.left = '300px';
        dataPane.appendChild(node);
    }

    /**
     * Create a marker relative to the browser window.
     * The top of the tag is the location specified.
     *
     * @param r row number
     */
    static createFixedNode(r) {
        const dataPane = document.getElementById('data-pane');
        let node = document.createElement('div');
        node.innerText = '[' + r + ']';
        node.style.position = 'fixed';
        node.style.top = r + 'px';
        node.style.left = '500px';
        dataPane.appendChild(node);
    }

    static isValidPhoneNumber(p) {
        if (!p)
            return false;
        p = p.replaceAll(/[^0-9]/g, '');
        return p.length === 10;
    }

    /**
     * Append html (as text) to the list of children of a node.
     * <br><br>
     * @code{tag} can be the id of the control or its jQuery node.
     * This function returns the jQuery node that can be used
     * for additional calls to this function (so it'll be faster).
     *
     * @param tag {object|string} see above
     * @param html {string} the html to be
     * @returns {object} the jQuery node
     */
    static appendChild(tag, html) {
        let node;
        if (typeof tag === 'string') {
            node = $('#' + tag);
            if (!node || !node.length) {
                console.log('tag ' + tag +' not found.');
                return;
            }
        } else
            node = tag;
        node.append(html);
        return node;
    }

    /**
     * Erase all the child nodes.
     * <br><br>
     * @code{tag} can be the id of the control or its jQuery node.
     * This function returns the jQuery node that can be used
     * for additional calls to this function.
     *
     * @param tag {object|string} see above
     * @returns {object} the jQuery node
     */
    static eraseChildren(tag) {
        let node;
        if (typeof tag === 'string') {
            node = $('#' + tag);
            if (!node || !node.length) {
                console.log('tag ' + tag +' not found.');
                return;
            }
        } else
            node = tag;
        node.empty();
        return node;
    }

    /**
     * Return number of milliseconds since 1970 UTC from a date and time control.
     *
     * @param {string} dateField the ID of the date field
     * @param {string} timeField the ID of the time field
     * @returns {number}
     */
    static getMilliseconds(dateField, timeField) {
        return DateTimeUtils.toMilliseconds($$(dateField).getIntValue(), $$(timeField).getValue());
    }

    /**
     * Get current location.
     *
     * @returns {Promise<GeolocationCoordinates>} or null
     */
    static getLocation() {
        return new Promise(function(resolve, reject) {
            const getPos = function (p) {
                resolve(p.coords);
            };
            const handleError = function(error) {
                resolve(null);
            };
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(getPos, handleError);
            } else
                resolve(null);
        });
    }

    /**
     * Toggle full screen mode.  This is mainly good for tablets and phones.
     * It doesn't make sense for desktops or laptops.
     * <br><br>
     * You can tell if it is a tablet or phone via:
     * <code>if (screen.width * screen.height < 1000000)  ...</code>
     * <br><br>
     * This function only works when it is attached to a button on the screen.
     * This is a restriction placed on us by the browsers to assure the user
     * is making the choice.
     * <br><br>
     * Note also that this does not work on an iPad.  Apple doesn't allow it.
     * They also make sure Chrome on an iPad doesn't work.  Presumably this
     * is to assure that browser apps don't compete against their app store.
     * <br><br>
     * This does work on Android devices.
     */
    static toggleFullscreen() {
        if (!Utils.isFullScreen) {
            const element = document.documentElement;
            // Check which implementation is available
            const requestMethod = element.requestFullScreen ||
                element.webkitRequestFullscreen ||
                element.mozRequestFullScreen ||
                element.msRequestFullscreen;

            if (requestMethod)
                requestMethod.apply(element);
            Utils.isFullScreen = true;
        } else {
            if (document.exitFullscreen)
                document.exitFullscreen();
            else if (document.webkitExitFullscreen) /* Safari */
                document.webkitExitFullscreen();
            else if (document.mozExitFullscreen)
                document.mozExitFullscreen();
            else if (document.msExitFullscreen)  /* IE11 */
                document.msExitFullscreen();
            Utils.isFullScreen = false;
        }
    }

    /**
     * Save an application global data item associated with a key.
     *
     * @param {string} key
     * @param {*} val
     *
     * @see Utils.getData
     * @see Utils.getAndEraseData
     */
    static saveData(key, val) {
        Utils.globalData[key] = val;
    };

    /**
     * Retrieve the application global data associated with a key.
     *
     * @param {string} key
     * @returns {*}
     *
     * @see Utils.saveData
     * @see Utils.getAndEraseData
     */
    static getData(key) {
        return Utils.globalData[key];
    };

    /**
     * Erase an application global data item returning its prior value.
     *
     * @param {string} key
     * @returns {*} the value before it was erased
     *
     * @see Utils.saveData
     * @see Utils.getData
     */
    static getAndEraseData(key) {
        const r = Utils.globalData[key];
        delete Utils.globalData[key];
        return r;
    };

    /**
     * Formats a social security number into a standard format.
     * If it is an invalid SSN, whatever is passed in is returned.
     *
     * @param s
     * @returns {string|null}
     */
    static formatSsn(s) {
        if (!s)
            return null;
        let n = s.replace(/\D/g, '');
        if (n.length !== 9)
            return s;
        return n.substring(0, 3) + '-' + n.substring(3, 5) + '-' + n.substring(5, 9);
    }

    /**
     * Return <code>true</code> if the passed in string is a valid SSN.
     *
     * @param s
     * @returns {boolean}
     */
    static isValidSsn(s) {
        return s && s.replace(/\D/g, '').length === 9;
    }

    /**
     * This method attempts to correct incorrect word capitalization.
     * It tries to assure that the first letter of each word is uppercase and the rest is lowercase.
     * If the incoming string is already mixed-case, it leaves it alone.
     *
     * @param s {string}
     * @returns {string}
     */
    static fixCapitalization(str) {
        if (!str)
            return str;
        const nUpper = str.replace(/[^A-Z]/g, '').length;
        const nLower = str.replace(/[^a-z]/g, '').length;
        if (!(nLower + nUpper) || nLower && nUpper)
            return str;

        // Otherwise, capitalize the first letter of each word
        return str.toLowerCase().replace(/(^|\s)\S/g, function(firstLetter) {
            return firstLetter.toUpperCase();
        });
    }

}

// Class variables
Utils.count = 1;
Utils.popup_zindex = 10;
Utils.popup_context = [];
Utils.watchContolValueChangesFlag = true;  // for backward compatability
Utils.someControlValueChangedFlag = false;
Utils.someControlValueChangedFun = null;
Utils.globalEnterFunction = null;
Utils.isFullScreen = false;

Utils.enterFunction = null;         //  If defined, execute function when enter key hit
Utils.enterFunctionStack = [];      //  Save stack for enter key to handle popups

Utils.screenStack = [];
Utils.lastScreenLoaded = {};  //  current stackframe

Utils.suspendDepth = 0;  // when > 0 suspend buttons

Utils.globalData = {};

/**
 * <code>forceASCII</code> forces ASCII representation of all text input.
 * This solves the problem of Unicode characters being too long for an ASCII SQL column.
 * If your database uses Unicode, then this should be set to <code>false</code>.
 * If set to <code>true</code>, it should be set elsewhere so that this file can remain
 * untouched.
 *
 * @type {boolean}
 */
Utils.forceASCII = false;

$(document).on('keypress', function(e) {
    if (Utils.enterFunction  &&  e.which === 13)
        Utils.enterFunction();
});

/**
 * This class is used to display a message dialog pop-up, which can be draggable. This module depends on 'util.js' and
 * its member functions 'roundCssTransformMatrix' and 'dragModal'. Use the CSS class 'modal-bg' to set blurred
 * background within containers that appear in the background.
 *
 * THIS CLASS IS DEPRECATED.  USE Utils.showMessage INSTEAD.
 *
 * @deprecated
 */
class MessageDialog {
    /**
     * Create the message dialog.
     *
     * @param title Dialog title.
     * @param message Message to show.
     * @param dialogType Dialog type.
     * @param onSuccess The function to execute on primary button click.
     * @param onFailure The failure function to execute on secondary button click.
     *
     * @deprecated
     */
    constructor(title, message, dialogType, onSuccess, onFailure) {
        this.init();

        this.title = title;
        this.message = message;
        this.dialogType = dialogType;
        this.successFunc = onSuccess;
        this.failureFunc = onFailure;

        // Make dialog draggable.
        Utils.dragModal(this.popupContainer, this.popupTitle);

        // Round up CSS transformations to get a crispier dialog.
        Utils.roundCssTransformMatrix(this.popupContainer.id);
    }

    set title(title) {
        this.popupTitle.innerText = title;
    }

    set message(message) {
        this.popupMsg.innerText = message;
    }

    set dialogType(dialogType) {
        switch (dialogType) {
            default:
            case MessageDialog.info:
                this.popupIcon.setAttribute("src", "../../kiss/assets/icons/alert-info.gif");

                this.popupOKBtn = document.createElement("INPUT");
                this.popupOKBtn.id = "popup-ok";
                this.popupOKBtn.classList.add("btn", "btn-popup");
                this.popupOKBtn.setAttribute("type", "button");
                this.popupOKBtn.setAttribute("value", "OK");
                this.popupOKBtn.addEventListener("click", this.onSuccessClose.bind(this));
                this.popupBtnBlock.appendChild(this.popupOKBtn);

                break;
            case MessageDialog.confirm:
                this.popupIcon.setAttribute("src", "../../kiss/assets/icons/alert-confirm.gif");

                this.popupYesBtn = document.createElement("INPUT");
                this.popupYesBtn.id = "popup-yes";
                this.popupYesBtn.classList.add("btn", "btn-popup");
                this.popupYesBtn.setAttribute("type", "button");
                this.popupYesBtn.setAttribute("value", "Yes");
                this.popupYesBtn.addEventListener("click", this.onSuccessClose.bind(this));
                this.popupBtnBlock.appendChild(this.popupYesBtn);

                this.popupNoBtn = document.createElement("INPUT");
                this.popupNoBtn.id = "popup-yes";
                this.popupNoBtn.classList.add("btn", "btn-popup");
                this.popupNoBtn.setAttribute("type", "button");
                this.popupNoBtn.setAttribute("value", "No");
                this.popupNoBtn.addEventListener("click", this.onFailureClose.bind(this));
                this.popupBtnBlock.appendChild(this.popupNoBtn);

                break;
            case MessageDialog.error:
                this.popupIcon.setAttribute("src", "../../kiss/assets/icons/alert-error.gif");

                this.popupOKBtn = document.createElement("INPUT");
                this.popupOKBtn.id = "popup-ok";
                this.popupOKBtn.classList.add("btn", "btn-popup");
                this.popupOKBtn.setAttribute("type", "button");
                this.popupOKBtn.setAttribute("value", "OK");
                this.popupOKBtn.addEventListener("click", this.onSuccessClose.bind(this));
                this.popupBtnBlock.appendChild(this.popupOKBtn);

                break;
            case MessageDialog.wait:
                this.popupIcon.setAttribute("src", "../../kiss/assets/icons/alert-info.gif");

                this.popupTitle.style.display = "none";
                this.popupMsgBlock.style.textAlign = "center";
                this.popupBtnBlock.style.display = "none";
                break;
        }
    }

    init() {
        this.body = document.getElementsByTagName("BODY")[0];

        this.modal = document.createElement("DIV");
        this.modal.id = "popup-modal";
        this.modal.classList.add("modal");
        this.modal.style.zIndex = Utils.popup_zindex++;
        this.body.appendChild(this.modal);

        this.popupContainer = document.createElement("DIV");
        this.popupContainer.id = "popup-container";
        this.popupContainer.classList.add('modal-content');
        this.modal.appendChild(this.popupContainer);

        this.popupTitle = document.createElement("DIV");
        this.popupTitle.id = "popup-title";
        this.popupTitle.classList.add("modal-title");
        this.popupContainer.appendChild(this.popupTitle);

        this.popupContent = document.createElement("DIV");
        this.popupContent.id = "popup-content";
        this.popupContainer.appendChild(this.popupContent);

        this.popupMsgBlock = document.createElement("DIV");
        this.popupMsgBlock.id = "popup-msg-block";
        this.popupContent.appendChild(this.popupMsgBlock);

        this.popupIcon = document.createElement("IMG");
        this.popupIcon.id = "popup-icon";
        this.popupMsgBlock.appendChild(this.popupIcon);

        this.popupMsg = document.createElement("SPAN");
        this.popupMsg.id = "popup-msg";
        this.popupMsgBlock.appendChild(this.popupMsg);

        this.popupBtnBlock = document.createElement("DIV");
        this.popupBtnBlock.id = "popup-btn-block";
        this.popupBtnBlock.style.padding = "5px";
        this.popupContent.appendChild(this.popupBtnBlock);
    }

    /**
     * Close the pop up dialog on success button press.
     * 
     * @param event
     */
    onSuccessClose(event) {
        if (this.successFunc) {
            this.successFunc();
        }

        MessageDialog.closeDialog();
    }

    /**
     * Close the pop up dialog on failure/cancel button press.
     * 
     * @param event
     */
    onFailureClose(event) {
        if (this.failureFunc) {
            this.failureFunc();
        }

        MessageDialog.closeDialog();
    }

    static closeDialog() {
        let body = document.getElementsByTagName("BODY")[0];
        let modal = document.getElementById("popup-modal");
        body.removeChild(modal);
    }

}

// Class variables
MessageDialog.info = 0;
MessageDialog.confirm = 1;
MessageDialog.error = 2;
MessageDialog.wait = 3;

// taken from https://github.com/accursoft/caret/blob/master/jquery.caret.js
(function($) {
    function focus(target) {
        if (!document.activeElement || document.activeElement !== target) {
            target.focus();
        }
    }

    $.fn.caret = function(pos) {
        let target = this[0];
        let isContentEditable = target && target.contentEditable === 'true';
        if (arguments.length === 0) {
            //get
            if (target) {
                //HTML5
                if (window.getSelection) {
                    //contenteditable
                    if (isContentEditable) {
                        focus(target);
                        let selection = window.getSelection();
                        // Opera 12 check
                        if (!selection.rangeCount) {
                            return 0;
                        }
                        let range1 = selection.getRangeAt(0),
                            range2 = range1.cloneRange();
                        range2.selectNodeContents(target);
                        range2.setEnd(range1.endContainer, range1.endOffset);
                        return range2.toString().length;
                    }
                    //textarea
                    return target.selectionStart;
                }
                //IE<9
                if (document.selection) {
                    focus(target);
                    //contenteditable
                    if (isContentEditable) {
                        let range1 = document.selection.createRange(),
                            range2 = document.body.createTextRange();
                        range2.moveToElementText(target);
                        range2.setEndPoint('EndToEnd', range1);
                        return range2.text.length;
                    }
                    //textarea
                    let pos = 0,
                        range = target.createTextRange(),
                        range2 = document.selection.createRange().duplicate(),
                        bookmark = range2.getBookmark();
                    range.moveToBookmark(bookmark);
                    while (range.moveStart('character', -1) !== 0) pos++;
                    return pos;
                }
                // Addition for jsdom support
                if (target.selectionStart)
                    return target.selectionStart;
            }
            //not supported
            return;
        }
        //set
        if (target) {
            if (pos === -1)
                pos = this[isContentEditable? 'text' : 'val']().length;
            //HTML5
            if (window.getSelection) {
                //contenteditable
                if (isContentEditable) {
                    focus(target);
                    window.getSelection().collapse(target.firstChild, pos);
                }
                //textarea
                else
                    target.setSelectionRange(pos, pos);
            }
            //IE<9
            else if (document.body.createTextRange) {
                if (isContentEditable) {
                    let range = document.body.createTextRange();
                    range.moveToElementText(target);
                    range.moveStart('character', pos);
                    range.collapse(true);
                    range.select();
                } else {
                    let range = target.createTextRange();
                    range.move('character', pos);
                    range.select();
                }
            }
            if (!isContentEditable)
                focus(target);
        }
        return this;
    };
})(jQuery);

