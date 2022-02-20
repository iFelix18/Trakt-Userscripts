// ==UserScript==
// @name            Profile image on Trakt
// @name:it         Immagine profilo su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description     Set your favorite movie, or TV series as your profile picture
// @description:it  Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-3.0.1/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @match           *://trakt.tv/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @run-at          document-idle
// @inject-into     content
// ==/UserScript==

/* global $, GM_config, migrateConfig, MyUtils, NodeCreationObserver */

(() => {
  migrateConfig('trakt-config', 'profile-image-on-trakt') // migrate to the new config ID

  //* GM_config
  GM_config.init({
    id: 'profile-image-on-trakt',
    title: `Profile image on Trakt v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        labelPos: 'right',
        type: 'checkbox',
        default: false
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}body{background-color:var(--mainBackground)!important;color:var(--text)!important}body .section_header{background-color:var(--background)!important;border-bottom:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .section_desc{background-color:var(--background)!important;border-top:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .reset{color:var(--text)!important}',
    events: {
      save: () => {
        window.alert('Profile image on Trakt: settings saved')
        GM_config.close()
        window.location.reload(false)
      }
    }
  })
  if (GM.info.scriptHandler !== 'Userscripts') GM.registerMenuCommand('Configure', () => GM_config.open()) //! Userscripts Safari: GM.registerMenuCommand is missing

  //* MyUtils
  const MU = new MyUtils({
    name: 'Profile image on Trakt',
    version: GM.info.script.version,
    author: 'Davide',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('profile-image-on-trakt')

  //* Functions
  /**
   * Get data
   *
   * @param {object} selector Element selector
   */
  const getData = (selector) => {
    $(selector).removeAttr('href').click(async () => {
      const fanart = $('#summary-wrapper').data('fanart') // get fanart
      const url = $('meta[property="og:url"]').attr('content') // get url
      const title = ($('#info-wrapper .info .action-buttons>.btn-checkin').length > 0) ? $('#info-wrapper .info .action-buttons>.btn-checkin').data('top-title') : $('meta[property="og:title"]').attr('content') // get title
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
   *
   * @param {object} selector Element selector
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
   *
   * @param {object} selector Element selector
   */
  const setProfileImageInfo = async (selector) => {
    const url = await GM.getValue('url')
    const title = await GM.getValue('title')
    const year = await GM.getValue('year')
    if (url !== undefined && title !== undefined && year !== undefined) {
      $(selector).parent().append(`<div class="hidden-xs" id="backdrop-info"><a href="${url}">${title} <span class="year">${year}</span></a></div>`)
      if ($('#cover-wrapper .shadow').length > 0) $('#cover-wrapper .shadow').remove()
      if ($('#cover-wrapper .shade').length === 0) $(selector).after('<div class="shade"></div>')
      MU.log('info is set')
    }
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-profile-image')
  NodeCreationObserver.onCreation('a[href$="/vip/cover"]', (element) => {
    getData(element)
  })
  NodeCreationObserver.onCreation('.is-self #cover-wrapper:not(.watching-now) .full-bg.enabled', (element) => {
    setProfileImage(element)
    setProfileImageInfo(element)
  })
})()
