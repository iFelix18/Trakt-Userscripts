// ==UserScript==
// @name            Advanced Filtering on Trakt
// @name:it         Filtri Avanzati su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Show the Advanced Filtering on Trakt
// @description:it  Mostra i Filtri Avanzati su Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.5
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/383595-advanced-filtering-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Advanced_Filtering_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/advanced-filtering-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/advanced-filtering-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@master/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@master/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@master/release/node-creation-observer-1.2.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @match           *://trakt.tv/*
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.info
// @grant           GM_info
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @run-at          document-start
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global GM_config, NodeCreationObserver, Utils, $ */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      save: () => {
        window.alert(`${GM.info.script.name}: settings saved`)
        GM_config.close()
        window.location.reload(false)
      }
    }
  })
  GM.registerMenuCommand('Configure', () => GM_config.open())

  //* Utils
  const ut = new Utils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: 'Felix',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  ut.init('trakt-config')

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-filtering')
  NodeCreationObserver.onCreation('a[href$="/vip/filtering"]', () => {
    $('.frame-wrapper .sidenav .alert-vip-required').hide()
    $('.frame-wrapper .sidenav h4 a.btn-filter-save').hide()
    $('a[href$="/vip/filtering"]').removeAttr('href').click(() => {
      $('.frame-wrapper .advanced-filters').toggleClass('open')
      $('.frame-wrapper .frame').toggleClass('with-advanced-filters')
      ut.log('clicked on Advanced Filters')
    })
  })
})()
