// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/381892-profile-image-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Profile_image_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @include         https://trakt.tv/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_deleteValue
// @run-at          document-idle
// @inject-into     content
// ==/UserScript==

(function () {
  'use strict'

  /* global $, NodeCreationObserver */

  NodeCreationObserver.init('observed-profile-image')
  NodeCreationObserver.onCreation('a[href$="/vip/cover"]', function () {
    getFanart(this)
  })
  NodeCreationObserver.onCreation('.is-self #cover-wrapper:not(.watching-now) .full-bg.enabled', function () {
    let parent = $(this).parent()
    parent.find('.shadow.hidden-xs').remove()
    parent.append('<div class="shade"></div>')
    setProfileImage(this)
  })
  NodeCreationObserver.onCreation('#results-top-wrapper:not(.watching-now) .poster-bg', function () {
    $(this).css('background-position', 'center 25%')
    $(this).css('background-size', 'cover')
    $(this).css('opacity', '1')
    $(this).css('filter', 'blur(0px)')
    setProfileImage(this)
  })

  // set profile image
  function setProfileImage (selector) {
    let fanart = GM_getValue('fanart')
    if (fanart !== undefined) { // use selected fanart
      $(selector).css('background-image', `url('${fanart}.webp')`)
      console.log('Profile image on Trakt: set background')
    } else {
      console.log('Profile image on Trakt: no background setted')
    }
  }

  // get fanart url
  function getFanart (selector) {
    $(selector).removeAttr('href').click(function () {
      let fanart = $('#summary-wrapper').data('fanart') // get fanart
      if (fanart === GM_getValue('fanart')) {
        GM_deleteValue('fanart') // remove fanart url
        alert('Profile image removed!')
      } else {
        GM_setValue('fanart', fanart) // save fanart url
        console.log(`Profile image on Trakt: url fanart is "${fanart}"`)
        alert('Profile image set!')
      }
    })
    $(selector).parent().css('cursor', 'pointer') // add pointer
  }
}())
