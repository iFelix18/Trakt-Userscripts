// ==UserScript==
// @name            Advanced Filtering on Trakt
// @name:it         Filtri Avanzati su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Show the Advanced Filtering on Trakt
// @description:it  Mostra i Filtri Avanzati su Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/383595-advanced-filtering-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Advanced_Filtering_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/advanced-filtering-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/advanced-filtering-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @match           *://trakt.tv/*
// @run-at          document-start
// @inject-into     content
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

'use strict'

/* global NodeCreationObserver, $ */

NodeCreationObserver.init('observed-filtering')
NodeCreationObserver.onCreation('a[href$="/vip/filtering"]', function () {
  $('.frame-wrapper .sidenav .alert-vip-required').hide()
  $('.frame-wrapper .sidenav h4 a.btn-filter-save').hide()
  $('a[href$="/vip/filtering"]').removeAttr('href').click(function () {
    $('.frame-wrapper .advanced-filters').toggleClass('open')
    $('.frame-wrapper .frame').toggleClass('with-advanced-filters')
  })
})
