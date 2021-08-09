// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Davide <iFelix18@protonmail.com>
// @namespace       https://github.com/iFelix18
// @icon            https://avatars.githubusercontent.com/u/19800006?v=4&s=64
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Davide (https://github.com/iFelix18)
// @license         MIT
// @version         2.6.2
//
// @homepageURL     https://github.com/iFelix18/Trakt-Userscripts#readme
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
//
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@a834d46afcc7d6f6297829876423f58bb14a0d97/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@43fd0fe4de1166f343883511e53546e87840aeaf/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@73a5f7bffb3009c77beee5ef541d3a12928b4531/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@73a5f7bffb3009c77beee5ef541d3a12928b4531/lib/api/omdb.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.6.0/dist/jquery.min.js#sha256-/xUj+3OJU5yExlq6GSYGSHk7tPXikynS7ogEvDej/m4=
// @require         https://cdn.jsdelivr.net/npm/mathjs@9.4.4/lib/browser/math.js#sha256-rzvQq+e/ZttXRQ4k2f0CpWp+yQOgRE2N8LqhkkGPIbE=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.7.7/dist/handlebars.min.js#sha256-ZSnrWNaPzGe8v25yP0S6YaMaDLMTDHC+4mHTw0xydEk=
//
// @match           *://trakt.tv/*
// @connect         omdbapi.com
//
// @grant           GM.info
// @grant           GM_info
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
//
// @run-at          document-start
// @inject-into     page
// ==/UserScript==

/* global $, GM_config, Handlebars, math, MonkeyUtils, NodeCreationObserver, OMDb */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      OMDbApiKey: {
        label: 'OMDb API Key',
        section: ['You can request a free OMDb API Key at:', 'https://www.omdbapi.com/apikey.aspx'],
        type: 'text',
        title: 'Your OMDb API Key',
        size: 70,
        default: ''
      },
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'above',
        type: 'checkbox',
        default: false
      },
      debugging: {
        label: 'Debugging',
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      init: () => {
        if (!GM_config.isOpen && GM_config.get('OMDbApiKey') === '') {
          window.onload = () => GM_config.open()
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

  //* OMDb API
  const omdb = new OMDb({
    apikey: GM_config.get('OMDbApiKey'),
    debug: GM_config.get('debugging')
  })

  //* Functions

  /**
   * Returns Trakt ID
   * @returns {number}
   */
  const id = () => {
    const id = $("a[href*='imdb']").attr('href').match(/tt\d+/)[0]
    return id
  }

  /**
   * Add style
   */
  const addStyle = () => {
    const css = '<style>#summary-ratings-wrapper ul li{margin-right:20px}#summary-ratings-wrapper ul.stats{margin-left:20px}#summary-ratings-wrapper ul li .icon img{margin-right:0}#summary-ratings-wrapper .summary-user-rating.popover-on{min-width:0}</style>'
    $('head').append(css)
    MU.log('style added')
  }

  /**
   * Add ratings
   * @param {string} type   Rating type
   * @param {string} logo   Logo
   * @param {string} rating Rating
   * @param {string} votes  Votes
   */
  const addRating = (type, logo, rating, votes) => {
    const html = `<li class=${type}-rating><script id=${type}-rating-template type=text/x-handlebars-template><div class=icon><img class=${type}-rating-logo src={{logo}}></div><div class=number><div class=rating>{{rating}}</div><div class=votes>{{votes}}</div></div></script>`
    $(html).appendTo($('#summary-ratings-wrapper .ratings'))

    const template = Handlebars.compile($(`#${type}-rating-template`).html())
    const context = {
      logo: logo,
      rating: rating,
      votes: votes
    }
    const compile = template(context)
    $(`.${type}-rating`).html(compile)
    MU.log(`${type} rating added`)
  }

  /**
   * Add Metascore bar
   * @param {string} rating Metacritic rating
   * @param {string} color  Metacritic color
   */
  const addMetascoreBar = (rating, color) => {
    $('#summary-ratings-wrapper .metascore-rating .votes').css({
      marginTop: '2px',
      height: '8px',
      backgroundColor: 'rgba(0, 0, 0, .5)'
    }).append(`<div class="bar" style="height: 8px; width: ${rating}%; background-color: ${color};"></div>`)
    MU.log('metascore bar added')
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('.movies.show #summary-ratings-wrapper, .shows.show #summary-ratings-wrapper', () => {
    const IMDbID = id()

    addStyle()
    omdb.get({
      id: IMDbID
    }).then((response) => {
      if (response.imdbRating && response.imdbRating !== 'N/A' && response.imdbVotes && response.imdbVotes !== 'N/A') { // IMDb
        const logo = 'https://ia.media-imdb.com/images/M/MV5BMTk3ODA4Mjc0NF5BMl5BcG5nXkFtZTgwNDc1MzQ2OTE@._V1_.png'
        const rating = response.imdbRating
        const votes = `${math.round((response.imdbVotes.replace(/,/g, '')) / 1000, 1)}k`
        MU.log(`imdb rating is "${rating}"`)
        MU.log(`imdb votes is "${votes}"`)
        addRating('imdb', logo, rating, votes)
      }
      if (response.Ratings[1] && response.Ratings[1] !== 'undefined' && response.Ratings[1].Source === 'Rotten Tomatoes' && response.Ratings[1].Value) { // Rotten Tomatoes
        const rottenLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
        const freshLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
        const rating = response.Ratings[1].Value
        const logo = (parseFloat(rating) < 60) ? rottenLogo : freshLogo
        const votes = (parseFloat(rating) < 60) ? 'Rotten' : 'Fresh'
        MU.log(`tomatometer is "${rating} - ${votes}"`)
        addRating('tomatometer', logo, rating, votes)
      }
      if (response.Metascore && response.Metascore !== 'N/A' && response.Metascore) { // Metascore
        const logo = 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg'
        const rating = response.Metascore
        const color = (rating < 40) ? '#ff0000' : (rating >= 40 && rating <= 60) ? '#ffcc33' : '#66cc33'
        MU.log(`metascore is "${rating}"`)
        addRating('metascore', logo, rating)
        addMetascoreBar(rating, color)
      }
    }).catch((error) => MU.error(error))
  })
})()
