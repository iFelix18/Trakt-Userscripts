// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.1.3
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/381892-profile-image-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Profile_image_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @match           *://trakt.tv/*
// @grant           GM_info
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_deleteValue
// @grant           GM_registerMenuCommand
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global $, NodeCreationObserver, GM_config */

(() => {
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
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      save: () => {
        alert(`${GM_info.script.name} : Settings saved`)
        location.reload(false)
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

  // set profile image info
  function setProfileImageInfo (selector) {
    const url = GM_getValue('url')
    const title = GM_getValue('title')
    const year = GM_getValue('year')
    if (url !== undefined && title !== undefined && year !== undefined) {
      $(selector).parent().append(`<div class="hidden-xs" id="backdrop-info"><a href="${url}">${title} <span class="year">${year}</span></a></div>`)
      log('info setted')
    } else {
      log('info not setted')
    }
  }

  // set profile image
  function setProfileImage (selector) {
    const fanart = GM_getValue('fanart')
    if (fanart !== undefined) {
      $(selector).css('background-image', `url('${fanart}.webp')`)
      log('background setted')
    } else {
      log('background not setted')
    }
  }

  // get data
  function getData (selector) {
    $(selector).removeAttr('href').click(() => {
      const fanart = $('#summary-wrapper').data('fanart') // get fanart
      const url = $('meta[property="og:url"]').attr('content') // get url
      const title = ($('#info-wrapper .info .action-buttons>.btn-checkin').length) ? $('#info-wrapper .info .action-buttons>.btn-checkin').data('top-title') : $('meta[property="og:title"]').attr('content') // get title
      const year = $('#summary-wrapper .summary .container h1 .year').html() // get year
      if (fanart === GM_getValue('fanart')) {
        GM_deleteValue('fanart') // remove fanart url
        GM_deleteValue('url') // remove url
        GM_deleteValue('title') // remove title
        GM_deleteValue('year') // remove year
        log('data deleted')
        alert('Profile image removed!')
      } else {
        GM_setValue('fanart', fanart) // save fanart url
        GM_setValue('url', url) // save url
        GM_setValue('title', title) // save title
        GM_setValue('year', year) // save year
        log('data setted')
        log(`url fanart is "${fanart}"`)
        log(`url is "${url}"`)
        log(`title is "${title}"`)
        log(`year is "${year}"`)
        alert('Profile image setted!')
      }
    })
    $(selector).parent().css('cursor', 'pointer') // add pointer
  }
})()
