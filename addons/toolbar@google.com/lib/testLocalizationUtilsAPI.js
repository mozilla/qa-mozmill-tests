/* ***** BEGIN LICENSE BLOCK *****
 * Version: MPL 1.1/GPL 2.0/LGPL 2.1
 *
 * The contents of this file are subject to the Mozilla Public License Version
 * 1.1 (the "License"); you may not use this file except in compliance with
 * the License. You may obtain a copy of the License at
 * http://www.mozilla.org/MPL/
 *
 * Software distributed under the License is distributed on an "AS IS" basis,
 * WITHOUT WARRANTY OF ANY KIND, either express or implied. See the License
 * for the specific language governing rights and limitations under the
 * License.
 *
 * The Original Code is Google toolbar mozmill test suite.
 *
 * The Initial Developer of the Original Code is Google.
 * Portions created by the Initial Developer are Copyright (C) 2010
 * the Initial Developer. All Rights Reserved.
 *
 * Contributor(s):
 *   Ankush Kalkote <ankush@google.com>
 *
 * Alternatively, the contents of this file may be used under the terms of
 * either the GNU General Public License Version 2 or later (the "GPL"), or
 * the GNU Lesser General Public License Version 2.1 or later (the "LGPL"),
 * in which case the provisions of the GPL or the LGPL are applicable instead
 * of those above. If you wish to allow use of your version of this file only
 * under the terms of either the GPL or the LGPL, and not to allow others to
 * use your version of this file under the terms of the MPL, indicate your
 * decision by deleting the provisions above and replace them with the notice
 * and other provisions required by the GPL or the LGPL. If you do not delete
 * the provisions above, a recipient may use your version of this file under
 * the terms of any one of the MPL, the GPL or the LGPL.
 *
 * ***** END LICENSE BLOCK ***** */

/**
 * @fileoverview This file contains utils functions related to localization.
 * This is NOT a test file.
 *
 * @author ankush@google.com (Ankush Kalkote)
 */

const MODULE_NAME = 'LocalizationUtilsAPI';
const DEFAULT_LOCALE = 'en';

// Map of FF-language and corresponding FTB locale name.
// Contains locales are supported by Google toolbar.
var localeMap = {'en-US' : 'en',
                 'en-GB' : 'en',
                 'es-ES' : 'es',
                 'fr-FR' : 'fr',
                 'de-DE' : 'de',
                 'it-IT' : 'it',
                 'zh-CN' : 'zh-CN',
                 'zh-TW' : 'zh-TW',
                 'ja-JP' : 'ja',
                 'ko-KR' : 'ko',
                 'pt-BR' : 'pt-BR',
                 'fi-FI' : 'fi',
                 'da-DK' : 'da',
                 'nl-NL' : 'nl',
                 'pl-PL' : 'pl',
                 'nb-NO' : 'no',
                 'ru-RU' : 'ru',
                 'sv-FI' : 'sv',
                 'pt-PT' : 'pt-PT',
                 'ar-AE' : 'ar',
                 'el-GR' : 'el',
                 'tr-TR' : 'tr',
                 'he-IL' : 'iw',
                 'cs-CZ' : 'cs',
                 'sk-SK' : 'sk',
                 'hu-HU' : 'hu',
                 'bg-BG' : 'bg',
                 'ca-ES' : 'ca',
                 'uk-UA' : 'uk',
                 'lt-LT' : 'lt',
                 'ro-RO' : 'ro',
                 'sl-SI' : 'sl' };

/**
 * Gets Toolbar locale corresponding to language of FF.
 * eg. For en-US FF we should have toolbar locale 'en'.
 * @param {string} language of Firefox.
 * @return {string} Firefox Toolbar locale.
 */
function getFTBLocaleForLanguage(language) {
  if (language in localeMap) {
    return localeMap[language];
  } else {
    // If FTB does not support that language, default is 'en'.
    return DEFAULT_LOCALE;
  }
}

