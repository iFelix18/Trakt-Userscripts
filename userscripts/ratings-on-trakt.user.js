// ==UserScript==
// @name               Ratings on Trakt
// @name:de            Bewertungen auf Trakt
// @name:es            Calificaciones en Trakt
// @name:fr            Évaluations sur Trakt
// @name:it            Valutazioni su Trakt
// @name:ru            Рейтинги на Trakt
// @name:zh-CN         Trakt上的评分
// @author             Davide <iFelix18@protonmail.com>
// @namespace          https://github.com/iFelix18
// @icon               https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description        Adds ratings from IMDb, Rotten Tomatoes, Metacritic and MyAnimeList to Trakt
// @description:de     Fügt Bewertungen von IMDb, Rotten Tomatoes, Metacritic und MyAnimeList zu Trakt hinzu
// @description:es     Agrega las calificaciones de IMDb, Rotten Tomatoes, Metacritic y MyAnimeList a Trakt
// @description:fr     Ajoute des évaluations d'IMDb, Rotten Tomatoes, Metacritic et MyAnimeList à Trakt
// @description:it     Aggiunge le valutazioni di IMDb, Rotten Tomatoes, Metacritic e MyAnimeList a Trakt
// @description:ru     Добавляет рейтинги IMDb, Rotten Tomatoes, Metacritic и MyAnimeList в Trakt
// @description:zh-CN  在Trakt中添加来自IMDb、烂番茄、Metacritic和MyAnimeList的评分。
// @copyright          2019, Davide (https://github.com/iFelix18)
// @license            MIT
// @version            4.7.0
// @homepage           https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL        https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL         https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL          https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL        https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require            https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/utils@5.1.1/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/omdb@2.0.0/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/rottentomatoes@2.0.0/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/jikan@2.0.0/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/@ifelix18/ratings@4.0.0/lib/index.min.js
// @require            https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.min.js
// @require            https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require            https://cdn.jsdelivr.net/npm/handlebars@4.7.7/dist/handlebars.min.js
// @match              *://trakt.tv/*
// @connect            api.jikan.moe
// @connect            omdbapi.com
// @connect            rottentomatoes.com
// @compatible         chrome
// @compatible         edge
// @compatible         firefox
// @compatible         safari
// @grant              GM_getValue
// @grant              GM_setValue
// @grant              GM.deleteValue
// @grant              GM.getValue
// @grant              GM.listValues
// @grant              GM.registerMenuCommand
// @grant              GM.setValue
// @grant              GM.xmlHttpRequest
// @run-at             document-start
// @inject-into        content
// ==/UserScript==

/* global $, GM_config, Handlebars, NodeCreationObserver, Ratings, UserscriptUtils */

(() => {
  //* Constants
  const cachePeriod = 3_600_000
  const id = GM.info.script.name.toLowerCase().replace(/\s/g, '-')
  const title = `${GM.info.script.name} v${GM.info.script.version} Settings`
  const fields = {
    OMDbApiKey: {
      label: 'API Key:',
      section: ['OMDb', 'You can request a free OMDb API Key at: https://www.omdbapi.com/apikey.aspx'],
      labelPos: 'left',
      type: 'text',
      title: 'Your OMDb API Key',
      size: 70,
      default: ''
    },
    hideDefaultRatings: {
      label: 'Prefer the ratings offered by this script to those offered by Trakt:',
      section: ['Features'],
      labelPos: 'left',
      type: 'checkbox',
      default: true
    },
    logging: {
      label: 'Logging:',
      section: ['Develop'],
      labelPos: 'left',
      type: 'checkbox',
      default: false
    },
    debugging: {
      label: 'Debugging:',
      labelPos: 'left',
      type: 'checkbox',
      default: false
    },
    clearCache: {
      label: 'Clear the cache',
      type: 'button',
      click: async () => {
        const values = await GM.listValues()

        for (const value of values) {
          const cache = await GM.getValue(value) // get cache
          if (cache.time) { GM.deleteValue(value) } // delete cache
        }

        UU.log('cache cleared')
        GM_config.close()
      }
    }
  }

  //* NodeCreationObserver
  NodeCreationObserver.init(id)

  //* GM_config
  UserscriptUtils.migrateConfig('trakt-GM_config', id) // migrate to the new GM_config ID
  GM_config.init({
    id,
    title,
    fields,
    css: ':root{--font:"Montserrat",sans-serif!important;--black:rgb(0, 0, 0)!important;--dark-grey:rgb(22, 22, 22)!important;--grey:rgb(51, 51, 51)!important;--light-grey:rgb(102, 102, 102)!important;--red:rgb(237, 34, 36)!important;--white:rgb(255, 255, 255)!important}#ratings-on-trakt *{color:var(--white)!important;font-family:var(--font)!important;font-size:14px!important;font-weight:400!important}#ratings-on-trakt{background:var(--dark-grey)!important}#ratings-on-trakt .config_header{font-size:34px!important;line-height:1.1!important;text-shadow:0 0 20px var(--black)!important}#ratings-on-trakt .section_header_holder{border:1px solid var(--grey)!important;margin-bottom:1em!important}#ratings-on-trakt .section_header{background:var(--grey)!important;border:1px solid var(--grey)!important;padding:8px!important;text-align:left!important;text-transform:uppercase!important}#ratings-on-trakt .section_desc{background:var(--black)!important;border:1px solid var(--grey)!important;border-left:0!important;border-right:0!important;font-size:13px!important;margin:0!important;padding:10px 8px!important;text-align:left!important}#ratings-on-trakt .config_var{align-items:center!important;display:flex!important;margin:0!important;padding:15px!important}#ratings-on-trakt .field_label{margin-left:6px!important}#ratings-on-trakt_field_OMDbApiKey{background-color:var(--grey)!important;border:1px solid var(--light-grey)!important;box-shadow:inset 0 1px 1px rgba(0,0,0,.075)!important;flex:1!important;padding:6px 12px!important}#ratings-on-trakt_field_OMDbApiKey:focus{box-shadow:inset 0 1px 1px rgba(0,0,0,.075),0 0 8px rgba(102,175,233,.6)!important;outline:0!important}#ratings-on-trakt button,#ratings-on-trakt input[type=button]{background:var(--grey)!important;border:1px solid transparent!important;padding:10px 16px!important}#ratings-on-trakt button:hover,#ratings-on-trakt input[type=button]:hover{filter:brightness(85%)!important}#ratings-on-trakt_buttons_holder button{background-color:var(--red)!important}#ratings-on-trakt .reset{margin-right:10px!important}',
    events: {
      init: () => {
        window.addEventListener('load', () => { // add style
          $('head').append('<style>@import url(https://fonts.googleapis.com/css2?family=Montserrat&display=swap);header#top-nav .navbar-nav.navbar-user:hover #user-menu{max-height:max-content}</style>')
        })
        if (!GM_config.isOpen && GM_config.get('OMDbApiKey') === '') { // first configuration
          window.addEventListener('load', () => GM_config.open())
        }
        if (GM.info.scriptHandler !== 'Userscripts') { //! Userscripts Safari: GM.registerMenuCommand is missing
          GM.registerMenuCommand('Configure', () => GM_config.open())
        }
      },
      save: () => {
        if (GM_config.get('OMDbApiKey') === '') {
          window.alert(`${GM.info.script.name}: check your settings and save`)
        } else {
          window.alert(`${GM.info.script.name}: settings saved`)
          GM_config.close()
          setTimeout(window.location.reload(false), 500)
        }
      }
    }
  })

  //* Utils
  const UU = new UserscriptUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: GM.info.script.author,
    logging: GM_config.get('logging')
  })
  UU.init(id)

  //* Ratings
  const rating = new Ratings({
    omdb_api_key: GM_config.get('OMDbApiKey'),
    cache_period: cachePeriod,
    debug: GM_config.get('debugging')
  })

  //* Handlebars
  Handlebars.registerHelper('ifEqual', function (a, b, options) {
    if (a === b) return options.fn(this)
    return options.inverse(this)
  })

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
   * Clear old data from the cache
   */
  const clearOldCache = async () => {
    const values = await GM.listValues()

    for (const value of values) {
      const cache = await GM.getValue(value) // get cache
      if ((Date.now() - cache.time) > 3_600_000) { GM.deleteValue(value) } // delete old cache
    }
  }

  /**
   * Hide default ratings offered by Trakt
   */
  const hideDefaultRatings = () => {
    $('#summary-ratings-wrapper ul li.imdb, #summary-ratings-wrapper ul li.rt, #summary-ratings-wrapper ul li.metacritic').hide()
  }

  /**
   * Returns IMDb ID
   *
   * @returns {string} IMDb ID
   */
  const getID = () => {
    return $('#info-wrapper .sidebar .external li a#external-link-imdb').attr('href').match(/tt\d+/)[0]
  }

  /**
   * Add template
   *
   * @param {object} target Target
   */
  const addTemplate = (target) => {
    const template = '<ul class=external-ratings style=margin-left:30px></ul><script id=external-ratings-template type=text/x-handlebars-template>{{#each ratings}} {{#ifEqual this.rating "N/A"}} {{else}}<li class={{this.source}}-rating><a href={{this.url}} target=_blank><img alt="{{this.source}} logo" class=logo src={{this.logo}}><div class=number><div class=rating style=display:flex;align-items:center;align-content:center;justify-content:center>{{this.rating}} {{#ifEqual this.rating "N/A"}} {{else}} <span style=font-weight:400;font-size:80%;opacity:.8>{{this.symbol}} </span>{{/ifEqual}}</div>{{#ifEqual this.source "metascore"}}<div class=votes style="width:100%;color:transparent;background:linear-gradient(to top,transparent 0,transparent 25%,{{this.votes}} 25%,{{this.votes}} 75%,transparent 75%,transparent 100%)">{{this.rating}}</div>{{else}}<div class=votes><span>{{this.votes}}</span></div>{{/ifEqual}}</div></a></li>{{/ifEqual}} {{/each}}</script>'

    $(template).insertAfter(target)
  }

  /**
   * Add ratings
   */
  const addRatings = async () => {
    clearOldCache() // clear old cache

    const target = $('#summary-ratings-wrapper .ratings') // target
    if (target.length === 0) return // check if it is on the main page

    const id = getID() // IMDb ID
    if (!id) return // check if the ID exists
    UU.log(`ID is '${id}'`)

    addTemplate(target) // add template

    // get ratings
    const ratings = await rating.get({ id }).then().catch(error => console.error(error))
    const elaboratedRatings = await rating.elaborate(ratings).then().catch(error => console.error(error))

    // compile template
    const template = Handlebars.compile($('#external-ratings-template').html())
    const context = { ratings: elaboratedRatings }
    const compile = template(context)
    $('.external-ratings').html(compile)

    if (GM_config.get('hideDefaultRatings')) hideDefaultRatings() // hide default ratings by Trakt
  }

  //* Script
  $(document).ready(() => {
    NodeCreationObserver.onCreation('body', () => {
      addSettingsToMenu() // link settings to trakt menu
    })
    NodeCreationObserver.onCreation('.movies.show #summary-ratings-wrapper, .shows.show #summary-ratings-wrapper, .shows.episode #summary-ratings-wrapper', () => {
      addRatings() // add ratings
    })
  })
})()
