// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=trakt.tv
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         1.2.5
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@abce8796cedbe28ac8e072d9824c4b9342985098/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/npm/gm4-polyfill@1.0.1/gm4-polyfill.min.js#sha256-qmLl2Ly0/+2K+HHP76Ul+Wpy1Z41iKtzptPD1Nt8gSk=
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js#sha256-OlRWIaZ5LD4UKqMHzIJ8Sc0ctSV2pTIgIvgppQRdNUU=
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @match           *://trakt.tv/*
// @compatible      chrome
// @compatible      edge
// @compatible      firefox
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.info
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM_deleteValue
// @grant           GM_getValue
// @grant           GM_info
// @grant           GM_registerMenuCommand
// @grant           GM_setValue
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, MonkeyUtils, NodeCreationObserver */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        labelPos: 'right',
        type: 'checkbox',
        default: false
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}#trakt-config{background-color:var(--mainBackground);color:var(--text)}#trakt-config .section_header{background-color:var(--background);border-bottom:none;border:1px solid var(--background);color:var(--text)}#trakt-config .section_desc{background-color:var(--background);border-top:none;border:1px solid var(--background);color:var(--text)}#trakt-config .reset{color:var(--text)}',
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

  //* Functions
  /**
   * Get data
   * @param {Object} selector
   */
  const getData = (selector) => {
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
        MU.log('data is set')
        MU.log(`url fanart is "${fanart}"`)
        MU.log(`url is "${url}"`)
        MU.log(`title is "${title}"`)
        MU.log(`year is "${year}"`)
        MU.alert('Profile picture is set!')
      }
    })
    $(selector).parent().css('cursor', 'pointer') // add pointer
  }

  /**
   * Set profile image
   * @param {Object} selector
   */
  const setProfileImage = async (selector) => {
    const fanart = await GM.getValue('fanart')
    if (fanart !== undefined) {
      $(selector).css('background-image', `url('${fanart}.webp')`)
      MU.log('background is set')
    }
  }

  /**
   * Set profile image info
   * @param {Object} selector
   */
  const setProfileImageInfo = async (selector) => {
    const url = await GM.getValue('url')
    const title = await GM.getValue('title')
    const year = await GM.getValue('year')
    if (url !== undefined && title !== undefined && year !== undefined) {
      $(selector).parent().append(`<div class="hidden-xs" id="backdrop-info"><a href="${url}">${title} <span class="year">${year}</span></a></div>`)
      MU.log('info is set')
    }
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-profile-image')
  NodeCreationObserver.onCreation('a[href$="/vip/cover"]', (i) => {
    getData(i)
  })
  NodeCreationObserver.onCreation('.is-self #cover-wrapper:not(.watching-now) .full-bg.enabled', (i) => {
    $(i).parent().find('.shadow.hidden-xs').remove()
    $(i).after('<div class="shade"></div>')
    setProfileImage(i)
    setProfileImageInfo(i)
  })
  NodeCreationObserver.onCreation('#results-top-wrapper:not(.watching-now) .poster-bg', (i) => {
    $(i).css('background-position', 'center 25%')
    $(i).css('background-size', 'cover')
    $(i).css('opacity', '.5')
    $(i).css('filter', 'blur(0px)')
    setProfileImage(i)
  })
})()
