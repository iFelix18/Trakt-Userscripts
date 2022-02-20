// ==UserScript==
// @name            External links on Trakt
// @name:it         Link esterni su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://www.google.com/s2/favicons?sz=64&domain=https://trakt.tv
// @description     Add more external links on Trakt
// @description:it  Aggiunge più link esterni su Trakt
// @copyright       2022, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.0
// @homepage        https://github.com/iFelix18/Trakt-Userscripts#readme
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/external-links-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/external-links-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@utils-3.0.1/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@wikidata-1.0.0/lib/api/wikidata.min.js
// @require         https://cdn.jsdelivr.net/npm/node-creation-observer@1.2.0/release/node-creation-observer-latest.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js
// @match           *://trakt.tv/*
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM.deleteValue
// @grant           GM.getValue
// @grant           GM.listValues
// @grant           GM.registerMenuCommand
// @grant           GM.setValue
// @grant           GM.xmlHttpRequest
// @run-at          document-start
// @inject-into     content
// ==/UserScript==

/* global $, GM_config, MyUtils, NodeCreationObserver, Wikidata */

(() => {
  //* GM_config
  GM_config.init({
    id: 'external-links-on-trakt',
    title: `External links on Trakt v${GM.info.script.version} Settings`,
    fields: {
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
    css: ':root{--mainBackground:#343433;--background:#282828;--text:#fff}body{background-color:var(--mainBackground)!important;color:var(--text)!important}body .section_header{background-color:var(--background)!important;border-bottom:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .section_desc{background-color:var(--background)!important;border-top:none!important;border:1px solid var(--background)!important;color:var(--text)!important}body .reset{color:var(--text)!important}',
    events: {
      save: () => {
        window.alert(`${GM.info.script.name}: settings saved`)
        GM_config.close()
        window.location.reload(false)
      }
    }
  })
  if (GM.info.scriptHandler !== 'Userscripts') GM.registerMenuCommand('Configure', () => GM_config.open()) //! Userscripts Safari: GM.registerMenuCommand is missing

  //* MyUtils
  const MU = new MyUtils({
    name: 'External links on Trakt',
    version: GM.info.script.version,
    author: 'Davide',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('external-links-on-trakt')

  //* Wikidata
  const wikidata = new Wikidata({
    endpoint: 'https://query.wikidata.org',
    debug: GM_config.get('debugging')
  })

  //* Functions
  /**
   * Returns IMDb ID
   *
   * @returns {string} IMDb ID
   */
  const getID = () => {
    const link = $('#info-wrapper .sidebar .external li a#external-link-imdb').attr('href') // IMDb link
    return link.match(/tt\d+/)[0]
  }

  /**
   * Returns ID type
   *
   * @returns {string} ID type
   */
  const getType = () => {
    switch ($('meta[property="og:type"]').attr('content')) {
      case 'video.movie':
        return 'movie'
      case 'video.tv_show':
        return 'tv'
      default:
        break
    }
  }

  /**
   * Returns site URL
   *
   * @param {string} key Site
   * @param {string} value ID
   * @returns {string} Site URL
   */
  const getURL = (key, value) => {
    switch (key) {
      case 'Metacritic':
        return `https://www.metacritic.com/${value}`
      case 'Rotten Tomatoes':
        return `https://www.rottentomatoes.com/${value}`
      case 'MyAnimeList':
        return `https://myanimelist.net/anime/${value}`
      case 'AniDB':
        return `https://anidb.net/anime/${value}`
      case 'AniList':
        return `https://anilist.co/anime/${value}`
      default:
        break
    }
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
   * Add external links
   *
   * @param {object} data IDs
   */
  const addLinks = (data) => {
    $.each(data[0].ids, (key, value) => {
      if ($(`#info-wrapper .sidebar .external li a#external-link-${key.toLowerCase()}`).length === 0 && value !== undefined && key !== 'Trakt') {
        const externalLink = `<a target="_blank" id="external-link-${key.toLowerCase()}" href="${getURL(key, value)}" data-original-title="" title="">${key}</a>`

        $('#info-wrapper .sidebar .external li a:not(:has(i))').last().after(externalLink) // desktop
        $('#info-wrapper .info .additional-stats li:last-child a:not([data-site]):not([data-method]):not([data-id])').last().after(externalLink).after(', ') // mobile
      }
    })
  }

  //* Script
  NodeCreationObserver.onCreation('.movies.show #info-wrapper .sidebar .external, .shows.show #info-wrapper .sidebar .external', () => {
    $(document).ready(async () => {
      clearOldCache() // clear old cache

      const id = getID() // get IMDb ID
      const type = getType() // get ID type
      const cache = await GM.getValue(id) // get cache

      if (cache !== undefined && ((Date.now() - cache.time) < 3_600_000) && !GM_config.get('debugging')) { // cache valid
        MU.log(`${id} data from cache`)
        addLinks(cache.data) // add external links
      } else { // cache not valid
        wikidata.ids(id, 'IMDb', type).then((data) => {
          MU.log(`${id} data from Wikidata`)
          GM.setValue(id, { data, time: Date.now() }) // set cache
          addLinks(data) // add external links
        })
      }
    })
  })
})()
