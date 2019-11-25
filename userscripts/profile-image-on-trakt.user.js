// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.2.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/381892-profile-image-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Profile_image_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
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
// @grant           GM.deleteValue
// @grant           GM_deleteValue
// @grant           GM.info
// @grant           GM_info
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global GM_config, NodeCreationObserver, MonkeyUtils, $ */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
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

  //* MonkeyUtils
  const MU = new MonkeyUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: 'Felix',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-config')

  //* functions
  const setProfileImageInfo = async (selector) => { // set profile image info
    const url = await GM.getValue('url')
    const title = await GM.getValue('title')
    const year = await GM.getValue('year')
    if (url !== undefined && title !== undefined && year !== undefined) {
      $(selector).parent().append(`<div class="hidden-xs" id="backdrop-info"><a href="${url}">${title} <span class="year">${year}</span></a></div>`)
      MU.log('info setted')
    } else {
      MU.log('info not setted')
    }
  }
  const setProfileImage = async (selector) => { // set profile image
    const fanart = await GM.getValue('fanart')
    if (fanart !== undefined) {
      $(selector).css('background-image', `url('${fanart}.webp')`)
      MU.log('background setted')
    } else {
      MU.log('background not setted')
    }
  }
  const getData = (selector) => { // get data
    $(selector).removeAttr('href').click(async () => {
      const fanart = $('#summary-wrapper').data('fanart') // get fanart
      const url = $('meta[property="og:url"]').attr('content') // get url
      const title = ($('#info-wrapper .info .action-buttons>.btn-checkin').length) ? $('#info-wrapper .info .action-buttons>.btn-checkin').data('top-title') : $('meta[property="og:title"]').attr('content') // get title
      const year = $('#summary-wrapper .summary .container h1 .year').html() // get year
      if (fanart === await GM.getValue('fanart')) {
        GM.deleteValue('fanart') // remove fanart url
        GM.deleteValue('url') // remove url
        GM.deleteValue('title') // remove title
        GM.deleteValue('year') // remove year
        MU.log('data deleted')
        MU.alert('Profile image removed!')
      } else {
        GM.setValue('fanart', fanart) // save fanart url
        GM.setValue('url', url) // save url
        GM.setValue('title', title) // save title
        GM.setValue('year', year) // save year
        MU.log('data setted')
        MU.log(`url fanart is "${fanart}"`)
        MU.log(`url is "${url}"`)
        MU.log(`title is "${title}"`)
        MU.log(`year is "${year}"`)
        MU.alert('Profile image setted!')
      }
    })
    $(selector).parent().css('cursor', 'pointer') // add pointer
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-profile-image')
  NodeCreationObserver.onCreation('a[href$="/vip/cover"]', function () {
    getData(this)
  })
  NodeCreationObserver.onCreation('.is-self #cover-wrapper:not(.watching-now) .full-bg.enabled', function () {
    $(this).parent().find('.shadow.hidden-xs').remove()
    $(this).after('<div class="shade"></div>')
    setProfileImage(this)
    setProfileImageInfo(this)
  })
  NodeCreationObserver.onCreation('#results-top-wrapper:not(.watching-now) .poster-bg', function () {
    $(this).css('background-position', 'center 25%')
    $(this).css('background-size', 'cover')
    $(this).css('opacity', '.5')
    $(this).css('filter', 'blur(0px)')
    setProfileImage(this)
  })
})()
