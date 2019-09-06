// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.4.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377523-ratings-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Ratings_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/mathjs@6.1.0/dist/math.min.js#sha256-zo143442aZ+Y+PiyyCVSkoFYE5sDJ8tXP4zeRpIZDdw=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.1.2/dist/handlebars.min.js#sha256-ngJY93C4H39YbmrWhnLzSyiepRuQDVKDNCWO2iyMzFw=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @match           *://trakt.tv/*
// @connect         omdbapi.com
// @grant           GM_info
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @grant           GM_addStyle
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global $, math, Handlebars, NodeCreationObserver, GM_config */

(() => {
  'use strict'

  console.log(`${GM_info.script.name} v${GM_info.script.version} by Felix is running!`)

  // configuration
  GM_config.init({
    id: 'trakt-config',
    title: `${GM_info.script.name} Settings`,
    fields: {
      apikey: {
        label: 'OMDb API Key',
        section: ['You can request a free OMDb API Key at:', 'https://www.omdbapi.com/apikey.aspx'],
        type: 'text',
        default: ''
      },
      logging: {
        label: 'Logging',
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      save: () => {
        alert(`${GM_info.script.name} : Settings saved`)
        location.reload(false)
      }
    }
  })

  // menu command to open configuration
  GM_registerMenuCommand(`${GM_info.script.name} - Configure`, () => {
    GM_config.open()
  })

  // logs
  const log = message => {
    if (GM_config.get('logging') === true) {
      console.log(`${GM_info.script.name}: ${message}`)
    }
  }

  // NodeCraetionObserver
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('body.movies #summary-ratings-wrapper, body.shows #summary-ratings-wrapper', () => {
    addStyle()
    getData()
  })

  // add metascore bar
  function addMetascoreBar (rating, color) {
    $('#summary-ratings-wrapper .metascore-rating .votes').css({
      marginTop: '2px',
      height: '8px',
      backgroundColor: 'rgba(0, 0, 0, .5)'
    }).append(`<div class="bar" style="height: 8px; width: ${rating}%; background-color: ${color};"></div>`)
    log('metascore bar added')
  }

  // add ratings
  function addRating (type, logo, rating, votes) {
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
    log(`${type} rating added`)
  }

  // get ratings
  function getRatings (data) {
    if (data && data.Response === 'True') {
      // IMDb
      if (data.imdbRating && data.imdbRating !== 'N/A' && data.imdbVotes && data.imdbVotes !== 'N/A') {
        const logo = 'https://ia.media-imdb.com/images/M/MV5BMTk3ODA4Mjc0NF5BMl5BcG5nXkFtZTgwNDc1MzQ2OTE@._V1_.png'
        const rating = data.imdbRating
        const votes = `${math.round((data.imdbVotes.replace(/,/g, '')) / 1000, 1)}k`
        log(`imdb rating is "${rating}"`)
        log(`imdb votes is "${votes}"`)
        addRating('imdb', logo, rating, votes)
      }

      // Rotten Tomatoes
      if (data.Ratings[1] && data.Ratings[1] !== 'undefined' && data.Ratings[1].Source === 'Rotten Tomatoes' && data.Ratings[1].Value) {
        const rottenLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
        const freshLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
        const rating = data.Ratings[1].Value
        const logo = (parseFloat(rating) < 60) ? rottenLogo : freshLogo
        const votes = (parseFloat(rating) < 60) ? 'Rotten' : 'Fresh'
        log(`tomatometer is "${rating} - ${votes}"`)
        addRating('tomatometer', logo, rating, votes)
      }

      // Metascore
      if (data.Metascore && data.Metascore !== 'N/A' && data.Metascore) {
        const logo = 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg'
        const rating = data.Metascore
        const color = (rating < 40) ? '#ff0000' : (rating >= 40 && rating <= 60) ? '#ffcc33' : '#66cc33'
        log(`metascore is "${rating}"`)
        addRating('metascore', logo, rating)
        addMetascoreBar(rating, color)
      }
    }
  }

  // get data
  function getData () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://www.omdbapi.com/?apikey=${OMDbApikey()}&i=${IMDbID()}`,
      onload: function (response) {
        const data = JSON.parse(response.responseText)
        if (data && data.Response === 'False' && data.Error) { // error
          const error = data.Error
          if (error === 'Invalid API key!') { // if invalid API Key
            alert(`${GM_info.script.name}: error "${error}"`)
            GM_config.open()
          } else { // other errors
            log(error)
          }
        } else {
          log(`the ${data.Type} is "${data.Title}"`)
          getRatings(data)
        }
      }
    })
  }

  // get IMDb ID
  function IMDbID () {
    const link = $("a[href*='imdb']")
    if (link.length) {
      const IMDbID = link.attr('href').match(/tt\d+/)[0]
      log(`imdb id is "${IMDbID}"`)
      return IMDbID
    }
  }

  // get API Key
  function OMDbApikey () {
    const apikey = GM_config.get('apikey')
    if (apikey === '') {
      GM_config.open()
    } else {
      log(`omdb api key is "${apikey}"`)
      return apikey
    }
  }

  function addStyle () {
    const css = '#summary-ratings-wrapper ul li{margin-right:25px}#summary-ratings-wrapper ul.stats{margin-left:25px}#summary-ratings-wrapper ul li .icon img{margin-right:0}#summary-ratings-wrapper .summary-user-rating.popover-on{min-width:0}'
    GM_addStyle(css)
    log('style added')
  }
})()
