// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.5.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377523-ratings-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Ratings_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@master/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@master/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@master/release/node-creation-observer-1.2.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/api/omdb.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/mathjs@6.2.3/dist/math.min.js#sha256-jnrFf6CiZ2veyKUaL7l7FHWW/ela8txaw/J7SVZzW5o=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.5.3/dist/handlebars.min.js#sha256-GwjGuGudzIwyNtTEBZuBYYPDvNlSMSKEDwECr6x6H9c=
// @match           *://trakt.tv/*
// @connect         omdbapi.com
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.info
// @grant           GM_info
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @grant           GM.xmlHttpRequest
// @grant           GM_xmlhttpRequest
// @grant           GM_addStyle
// @run-at          document-start
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global GM_config, NodeCreationObserver, Utils, OMDb, $, math, Handlebars, GM_addStyle */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      omdbapikey: {
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
        if (!GM_config.isOpen && GM_config.get('omdbapikey') === '') {
          window.onload = () => GM_config.open()
        }
      },
      save: () => {
        if (!GM_config.isOpen && GM_config.get('omdbapikey') === '') {
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

  //* Utils
  const ut = new Utils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: 'Felix',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  ut.init('trakt-config')

  //* OMDb API
  const omdb = new OMDb({
    apikey: GM_config.get('omdbapikey'),
    debug: GM_config.get('debugging')
  })

  //* NodeCraetionObserver
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('body.movies #summary-ratings-wrapper, body.shows #summary-ratings-wrapper', () => {
    addStyle()

    const id = $("a[href*='imdb']").attr('href').match(/tt\d+/)[0]
    ut.log(`imdb id is "${id}"`)

    omdb.get({
      id: id
    }).then((data) => {
      if (data.imdbRating && data.imdbRating !== 'N/A' && data.imdbVotes && data.imdbVotes !== 'N/A') { // IMDb
        const logo = 'https://ia.media-imdb.com/images/M/MV5BMTk3ODA4Mjc0NF5BMl5BcG5nXkFtZTgwNDc1MzQ2OTE@._V1_.png'
        const rating = data.imdbRating
        const votes = `${math.round((data.imdbVotes.replace(/,/g, '')) / 1000, 1)}k`
        ut.log(`imdb rating is "${rating}"`)
        ut.log(`imdb votes is "${votes}"`)
        addRating('imdb', logo, rating, votes)
      }
      if (data.Ratings[1] && data.Ratings[1] !== 'undefined' && data.Ratings[1].Source === 'Rotten Tomatoes' && data.Ratings[1].Value) { // Rotten Tomatoes
        const rottenLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
        const freshLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
        const rating = data.Ratings[1].Value
        const logo = (parseFloat(rating) < 60) ? rottenLogo : freshLogo
        const votes = (parseFloat(rating) < 60) ? 'Rotten' : 'Fresh'
        ut.log(`tomatometer is "${rating} - ${votes}"`)
        addRating('tomatometer', logo, rating, votes)
      }
      if (data.Metascore && data.Metascore !== 'N/A' && data.Metascore) { // Metascore
        const logo = 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg'
        const rating = data.Metascore
        const color = (rating < 40) ? '#ff0000' : (rating >= 40 && rating <= 60) ? '#ffcc33' : '#66cc33'
        ut.log(`metascore is "${rating}"`)
        addRating('metascore', logo, rating)
        addMetascoreBar(rating, color)
      }
    }).catch((error) => console.error(error))
  })

  // add metascore bar
  const addMetascoreBar = (rating, color) => {
    $('#summary-ratings-wrapper .metascore-rating .votes').css({
      marginTop: '2px',
      height: '8px',
      backgroundColor: 'rgba(0, 0, 0, .5)'
    }).append(`<div class="bar" style="height: 8px; width: ${rating}%; background-color: ${color};"></div>`)
    ut.log('metascore bar added')
  }

  // add ratings
  const addRating = (type, logo, rating, votes) => {
    // add HTML structure
    const html = `<script id="${type}-rating-template" type="text/x-handlebars-template"><div class="icon"><img class="${type}-rating-logo" src="{{logo}}"></div><div class="number"><div class="rating">{{rating}}</div><div class="votes">{{votes}}</div></div></script><li class="${type}-rating"></li>`
    $(html).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    const template = Handlebars.compile($(`#${type}-rating-template`).html())
    const context = {
      logo: logo,
      rating: rating,
      votes: votes
    }
    const compile = template(context)
    $(`.${type}-rating`).html(compile)
    ut.log(`${type} rating added`)
  }

  // add style
  const addStyle = () => {
    const css = '#summary-ratings-wrapper ul li{margin-right:25px}#summary-ratings-wrapper ul.stats{margin-left:25px}#summary-ratings-wrapper ul li .icon img{margin-right:0}#summary-ratings-wrapper .summary-user-rating.popover-on{min-width:0}'
    GM_addStyle(css)
    ut.log('style added')
  }
})()
