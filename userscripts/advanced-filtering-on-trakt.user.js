// ==UserScript==
// @name            Advanced Filtering on Trakt
// @name:it         Filtri Avanzati su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=trakt.tv
// @description     Show the Advanced Filtering on Trakt
// @description:it  Mostra i Filtri Avanzati su Trakt
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         1.1.1
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/advanced-filtering-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/advanced-filtering-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@abce8796cedbe28ac8e072d9824c4b9342985098/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/npm/gm4-polyfill@1.0.1/gm4-polyfill.min.js#sha256-qmLl2Ly0/+2K+HHP76Ul+Wpy1Z41iKtzptPD1Nt8gSk=
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js#sha256-OlRWIaZ5LD4UKqMHzIJ8Sc0ctSV2pTIgIvgppQRdNUU=
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @match           *://trakt.tv/*
// @grant           GM.getValue
// @grant           GM.info
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global GM_config, NodeCreationObserver, MonkeyUtils, $ */

(() => {
  'use strict'

  console.log('Not working script, remove it!')

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'right',
        type: 'checkbox',
        default: false
      }
    },
    /* cspell: disable-next-line */
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config #trakt-config_field_magic{margin:0 auto;display:block}#trakt-config .reset{color:#fff}',
    events: {
      save: () => {
        window.alert(`${GM.info.script.name}: settings saved`)
        GM_config.close()
        window.location.reload(false)
      }
    }
  })
  GM.registerMenuCommand('Configure', () => GM_config.open())

  //* MonkeyUtils
  const MU = new MonkeyUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: GM.info.script.author,
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-config')

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-filtering')
  NodeCreationObserver.onCreation('a[href$="/vip/filtering"]', () => {
    $('.frame-wrapper .sidenav .alert-vip-required').hide()
    $('.frame-wrapper .sidenav h4 a.btn-filter-save').hide()
    $('a[href$="/vip/filtering"]').removeAttr('href').click(() => {
      $('.frame-wrapper .advanced-filters').toggleClass('open')
      $('.frame-wrapper .frame').toggleClass('with-advanced-filters')
      MU.log('clicked on Advanced Filters')
    })
  })
})()
