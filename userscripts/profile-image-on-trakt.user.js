// ==UserScript==
// @name               Profile image on Trakt
// @name:de            Profilbild auf Trakt
// @name:es            Imagen de perfil en Trakt
// @name:fr            Image de profil sur Trakt
// @name:it            Immagine profilo su Trakt
// @name:ru            Изображение профиля на Trakt
// @name:zh-CN         在Trakt上的简介图片
// @author             Davide <iFelix18@protonmail.com>
// @namespace          https://github.com/iFelix18
// @icon               https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description        Set your favorite movie, or TV series as your profile picture
// @description:de     Legen Sie Ihren Lieblingsfilm oder Ihre Lieblingsserie als Ihr Profilbild fest
// @description:es     Establece tu película o serie de televisión favorita como foto de perfil
// @description:fr     Choisissez votre film ou votre série télévisée préférée comme photo de profil.
// @description:it     Imposta il tuo film preferito, o serie TV come immagine del tuo profilo
// @description:ru     Установите свой любимый фильм или сериал в качестве фотографии профиля
// @description:zh-CN  设置你最喜欢的电影或电视剧作为你的个人照片
// @copyright          2019, Davide (https://github.com/iFelix18)
// @license            MIT
// @version            2.2.0
// @homepage           https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL        https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL         https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL          https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/profile-image-on-trakt.meta.js
// @downloadURL        https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/profile-image-on-trakt.user.js
// @require            https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/utils@5.1.1/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require            https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @match              *://trakt.tv/*
// @compatible         chrome
// @compatible         edge
// @compatible         firefox
// @compatible         safari
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.deleteValue
// @grant              GM.getValue
// @grant              GM.registerMenuCommand
// @grant              GM.setValue
// @run-at             document-idle
// @inject-into        content
// ==/UserScript==

/* global $, GM_config, NodeCreationObserver, UserscriptUtils */

(() => {
  //* Constants
  const id = GM.info.script.name.toLowerCase().replace(/\s/g, '-')
  const title = `${GM.info.script.name} v${GM.info.script.version} Settings`
  const fields = {
    logging: {
      label: 'Logging',
      section: ['Develop'],
      labelPos: 'right',
      type: 'checkbox',
      default: false
    }
  }

  //* GM_config
  UserscriptUtils.migrateConfig('trakt-config', id) // migrate to the new GM_config ID
  GM_config.init({
    id,
    title,
    fields,
    css: ':root{--font:"Montserrat",sans-serif;--background-grey:rgb(29, 29, 29);--black:rgb(0, 0, 0);--dark-grey:rgb(22, 22, 22);--grey:rgb(51, 51, 51);--red:rgb(237, 34, 36);--white:rgb(255, 255, 255)}#profile-image-on-trakt *{color:var(--white)!important;font-family:var(--font)!important;font-size:14px!important;font-weight:400!important}#profile-image-on-trakt{background:var(--background-grey)!important}#profile-image-on-trakt .config_header{font-size:34px!important;line-height:1.1!important;text-shadow:0 0 20px var(--black)!important}#profile-image-on-trakt .section_header_holder{background:var(--dark-grey)!important;border:1px solid var(--grey)!important;margin-bottom:1em!important}#profile-image-on-trakt .section_header{background:var(--grey)!important;border:1px solid var(--grey)!important;padding:8px!important;text-align:left!important;text-transform:uppercase!important}#profile-image-on-trakt .config_var{align-items:center!important;display:flex!important;margin:0!important;padding:15px!important}#profile-image-on-trakt .field_label{margin-left:6px!important}#profile-image-on-trakt button,#profile-image-on-trakt input[type=button]{background:var(--grey)!important;border:1px solid transparent!important;padding:10px 16px!important}#profile-image-on-trakt button:hover,#profile-image-on-trakt input[type=button]:hover{filter:brightness(85%)!important}#profile-image-on-trakt_buttons_holder button{background-color:var(--red)!important}#profile-image-on-trakt .reset{margin-right:10px!important}',
    events: {
      init: () => {
        window.addEventListener('load', () => { // add style
          $('head').append('<style>@import url(https://fonts.googleapis.com/css2?family=Montserrat&display=swap);header#top-nav .navbar-nav.navbar-user:hover #user-menu{max-height:max-content}</style>')
        })
        if (GM.info.scriptHandler !== 'Userscripts') { //! Userscripts Safari: GM.registerMenuCommand is missing
          GM.registerMenuCommand('Configure', () => GM_config.open())
        }
      },
      save: () => {
        window.alert(`${GM.info.script.name}: settings saved`)
        GM_config.close()
        setTimeout(window.location.reload(false), 500)
      }
    }
  })

  //* NodeCreationObserver
  NodeCreationObserver.init(id)

  //* Utils
  const UU = new UserscriptUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: GM.info.script.author,
    logging: GM_config.get('logging')
  })
  UU.init(id)

  //* Functions
  /**
   * Adds a link to the menu to access the script configuration
   */
  const addSettingsToMenu = () => {
    const menu = `<li class=${id}><a href=""onclick=return!1>${GM.info.script.name}</a>`

    $('#user-menu ul li.separator').last().after(menu)
    $(`.${id}`).click(() => GM_config.open())
  }

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
        UU.log('data deleted')
        UU.alert('Profile image removed!')
      } else {
        GM.setValue('fanart', fanart) // save fanart url
        GM.setValue('url', url) // save url
        GM.setValue('title', title) // save title
        GM.setValue('year', year) // save year
        UU.log('data is set')
        UU.log(`url fanart is "${fanart}"`)
        UU.log(`url is "${url}"`)
        UU.log(`title is "${title}"`)
        UU.log(`year is "${year}"`)
        UU.alert('Profile picture is set!')
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
      UU.log('background is set')
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
      UU.log('info is set')
    }
  }

  //* Script
  $(document).ready(() => {
    NodeCreationObserver.onCreation('body', () => {
      addSettingsToMenu() // link settings to trakt menu
    })
    NodeCreationObserver.onCreation('a[href$="/vip/cover"]', (element) => {
      getData(element)
    })
    NodeCreationObserver.onCreation('.is-self #cover-wrapper:not(.watching-now) .full-bg.enabled', (element) => {
      setProfileImage(element)
      setProfileImageInfo(element)
    })
  })
})()
