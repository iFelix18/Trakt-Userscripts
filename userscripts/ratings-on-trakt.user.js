// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv/
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         4.2.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-2.3.4/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@omdb-1.2.4/lib/api/omdb.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@rottentomatoes-1.1.3/lib/api/rottentomatoes.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@jikan-1.0.0/lib/api/jikan.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@ratings-2.0.0/lib/utils/ratings.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.7.7/dist/handlebars.min.js
// @match           *://trakt.tv/*
// @connect         api.jikan.moe
// @connect         omdbapi.com
// @connect         rottentomatoes.com
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.listValues
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM.xmlHttpRequest
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, Handlebars, MonkeyUtils, NodeCreationObserver, Ratings */

(() => {
  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      OMDbApiKey: {
        label: 'OMDb API Key',
        section: ['You can request a free OMDb API Key at:', 'https://www.omdbapi.com/apikey.aspx'],
        labelPos: 'left',
        type: 'text',
        title: 'Your OMDb API Key',
        size: 70,
        default: ''
      },
      hideDefaultRatings: {
        label: 'Prefer the ratings offered by this script to those offered by Trakt',
        section: ['Features'],
        labelPos: 'right',
        type: 'checkbox',
        default: true
      },
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'right',
        type: 'checkbox',
        default: false
      },
      debugging: {
        label: 'Debugging',
        labelPos: 'right',
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

          MU.log('cache cleared')
          GM_config.close()
        }
      }
    },
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}#trakt-config{background-color:var(--mainBackground);color:var(--text)}#trakt-config .section_header{background-color:var(--background);border-bottom:none;border:1px solid var(--background);color:var(--text)}#trakt-config .section_desc{background-color:var(--background);border-top:none;border:1px solid var(--background);color:var(--text)}#trakt-config .reset{color:var(--text)}',
    events: {
      init: () => {
        if (!GM_config.isOpen && GM_config.get('OMDbApiKey') === '') {
          window.addEventListener('load', () => GM_config.open())
        }
      },
      save: () => {
        if (!GM_config.isOpen && GM_config.get('OMDbApiKey') === '') {
          window.alert(`${GM.info.script.name}: check your settings and save`)
        } else {
          window.alert(`${GM.info.script.name}: settings saved`)
          GM_config.close()
          window.location.reload(false)
        }
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

  //* Ratings
  const rating = new Ratings({
    omdb_apikey: GM_config.get('OMDbApiKey'),
    cache_period: 3_600_000,
    debug: GM_config.get('debugging')
  })

  //* Handlebars
  Handlebars.registerHelper('ifEqual', function (a, b, options) {
    if (a === b) return options.fn(this)
    return options.inverse(this)
  })

  //* Functions
  /**
   * Returns IMDb ID
   * @returns {string}
   */
  const getID = () => {
    return $('#info-wrapper .sidebar .external li a#external-link-imdb').attr('href').match(/tt\d+/)[0]
  }

  /**
   * Add template
   */
  const addTemplate = () => {
    const template = '<ul class=external-ratings style=margin-left:30px></ul><script id=external-ratings-template type=text/x-handlebars-template>{{#each ratings}} {{#ifEqual this.rating "N/A"}} {{else}}<li class={{this.source}}-rating><a href={{this.url}} target=_blank><img alt="{{this.source}} logo" class=logo src={{this.logo}}><div class=number><div class=rating style=display:flex;align-items:center;align-content:center;justify-content:center>{{this.rating}} {{#ifEqual this.rating "N/A"}} {{else}} <span style=font-weight:400;font-size:80%;opacity:.8>{{this.symbol}} </span>{{/ifEqual}}</div>{{#ifEqual this.source "metascore"}}<div class=votes style="width:100%;color:transparent;background:linear-gradient(to top,transparent 0,transparent 25%,{{this.votes}} 25%,{{this.votes}} 75%,transparent 75%,transparent 100%)">{{this.rating}}</div>{{else}}<div class=votes><span>{{this.votes}}</span></div>{{/ifEqual}}</div></a></li>{{/ifEqual}} {{/each}}</script>'
    const target = '#summary-ratings-wrapper .ratings'

    $(template).insertAfter(target)
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

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('.movies.show #summary-ratings-wrapper, .shows.show #summary-ratings-wrapper, .shows.episode #summary-ratings-wrapper', () => {
    $(document).ready(() => {
      clearOldCache()

      if ($('#summary-ratings-wrapper .ratings').length === 0) return // check if it is on the main page

      const id = getID() // IMDb ID

      if (!id) return // check if an ID exists

      MU.log(`ID is '${id}'`)

      addTemplate()

      rating.get(id).then((data) => {
        rating.elaborate(data).then((data) => {
          if (GM_config.get('hideDefaultRatings')) hideDefaultRatings()

          const template = Handlebars.compile($('#external-ratings-template').html())
          const context = { ratings: data }
          const compile = template(context)

          $('.external-ratings').html(compile)
        }).catch((error) => console.error(error))
      }).catch((error) => console.error(error))
    })
  })
})()
