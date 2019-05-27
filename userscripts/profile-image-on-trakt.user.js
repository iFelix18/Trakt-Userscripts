// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.1.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/381892-profile-image-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Profile_image_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @match           *://trakt.tv/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_deleteValue
// @run-at          document-idle
// @inject-into     content
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global $, NodeCreationObserver */

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
    let url = GM_getValue('url')
    let title = GM_getValue('title')
    let year = GM_getValue('year')
    if (url !== undefined && title !== undefined && year !== undefined) {
      $(selector).parent().append(`<div class="hidden-xs" id="backdrop-info"><a href="${url}">${title} <span class="year">${year}</span></a></div>`)
      console.log('Profile image on Trakt: set info')
    } else {
      console.log('Profile image on Trakt: no info setted')
    }
  }

  // set profile image
  function setProfileImage (selector) {
    let fanart = GM_getValue('fanart')
    if (fanart !== undefined) {
      $(selector).css('background-image', `url('${fanart}.webp')`)
      console.log('Profile image on Trakt: set background')
    } else {
      console.log('Profile image on Trakt: no background setted')
    }
  }

  // get data
  function getData (selector) {
    $(selector).removeAttr('href').click(function () {
      let fanart = $('#summary-wrapper').data('fanart') // get fanart
      let url = $('#info-wrapper .info .action-buttons>.btn-checkin').data('url') // get url
      let title = $('#info-wrapper .info .action-buttons>.btn-checkin').data('top-title') // get title
      let year = $('#summary-wrapper .summary .container h1 .year').html() // get year
      if (fanart === GM_getValue('fanart')) {
        GM_deleteValue('fanart') // remove fanart url
        GM_deleteValue('url') // remove url
        GM_deleteValue('title') // remove title
        GM_deleteValue('year') // remove year
        alert('Profile image removed!')
      } else {
        GM_setValue('fanart', fanart) // save fanart url
        GM_setValue('url', url) // save url
        GM_setValue('title', title) // save title
        GM_setValue('year', year) // save year
        console.log(`Profile image on Trakt: url fanart is "${fanart}"`)
        console.log(`Profile image on Trakt: url is "${url}"`)
        console.log(`Profile image on Trakt: title is "${title}"`)
        console.log(`Profile image on Trakt: year is "${year}"`)
        alert('Profile image set!')
      }
    })
    $(selector).parent().css('cursor', 'pointer') // add pointer
  }
}())
