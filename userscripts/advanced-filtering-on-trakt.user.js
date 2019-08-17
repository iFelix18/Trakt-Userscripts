// ==UserScript==
// @name            Advanced Filtering on Trakt
// @name:it         Filtri Avanzati su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Show the Advanced Filtering on Trakt
// @description:it  Mostra i Filtri Avanzati su Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.3
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/383595-advanced-filtering-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Advanced_Filtering_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/advanced-filtering-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/advanced-filtering-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @match           *://trakt.tv/*
// @grant           GM_info
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @run-at          document-start
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global  $, NodeCreationObserver, GM_config */

(function () {
  'use strict'

  console.log(`${GM_info.script.name} v${GM_info.script.version} by Felix is running!`)

  // configuration
  GM_config.init({
    id: 'trakt-config',
    title: `${GM_info.script.name} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config {background-color: #343434; color: #fff;} #trakt-config * {font-family: varela round,helvetica neue,Helvetica,Arial,sans-serif;} #trakt-config .section_header {background-color: #282828; border: 1px solid #282828; border-bottom: none; color: #fff; font-size: 10pt;} #trakt-config .section_desc {background-color: #282828; border: 1px solid #282828; border-top: none; color: #fff; font-size: 10pt;} #trakt-config .reset {color: #fff;}',
    events: {
      save: () => {
        alert(`${GM_info.script.name} : Settings saved`)
        location.reload()
      }
    }
  })

  // menu command to open configuration
  GM_registerMenuCommand(`${GM_info.script.name} - Configure`, () => {
    GM_config.open()
  })

  // logs
  const log = message => {
    if (GM_config.get('logging') === true) {
      console.log(`${GM_info.script.name}: ${message}`)
    }
  }

  // NodeCreationObserver
  NodeCreationObserver.init('observed-filtering')
  NodeCreationObserver.onCreation('a[href$="/vip/filtering"]', function () {
    $('.frame-wrapper .sidenav .alert-vip-required').hide()
    $('.frame-wrapper .sidenav h4 a.btn-filter-save').hide()
    $('a[href$="/vip/filtering"]').removeAttr('href').click(function () {
      $('.frame-wrapper .advanced-filters').toggleClass('open')
      $('.frame-wrapper .frame').toggleClass('with-advanced-filters')
      log('Click on Advanced Filters')
    })
  })
})()
