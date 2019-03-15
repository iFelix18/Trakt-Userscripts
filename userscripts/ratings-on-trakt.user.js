// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.3.1
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377523-ratings-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Ratings_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/npm/mathjs@5.4.2/dist/math.min.js#sha256-W2xP+GeD3rATAAJ/rtjz0uNLqO9Ve9yk9744ImX8GWY=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.0.12/dist/handlebars.min.js#sha256-qlku5J3WO/ehJpgXYoJWC2px3+bZquKChi4oIWrAKoI=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @match           *://trakt.tv/*
// @connect         omdbapi.com
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// @inject-into     content
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global $, math, Handlebars, NodeCreationObserver, GM_config */

  // observe node
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('.movies #summary-wrapper .summary .container h1, .shows #summary-wrapper .summary .container h1', function () {
    addCSS()
    getData()
  })

  // color
  function color (rating) {
    let color = 0
    if (rating < 40) {
      color = '#ff0000'
    } else if (rating >= 40 && rating <= 60) {
      color = '#ffcc33'
    } else if (rating > 60) {
      color = '#66cc33'
    }
    return color
  }

  // add metascore bar
  function addMetascoreBar (rating, color) {
    $('#summary-ratings-wrapper .Metascore-rating .votes').css({
      'margin-top': '2px',
      'height': '8px',
      'background-color': 'rgba(0, 0, 0, .5)'
    }).append(`<div class="bar" style="height: 8px; width: ${rating}%; background-color: ${color};"></div>`)
  }

  // get Fresh or Rotten
  function getTomatometer (rating) {
    let votes = 0
    if (parseFloat(rating) < 60) {
      votes = 'Rotten'
    } else {
      votes = 'Fresh'
    }
    return votes
  }

  // get RottenTomatoes Logo
  function getRottenTomatoesLogo (rating) {
    let logo = 0
    if (parseFloat(rating) < 60) {
      logo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
    } else {
      logo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
    }
    return logo
  }

  // add ratings
  function addRating (type, logo, rating, votes) {
    // add HTML structure
    $(`
      <script id="${type}-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="${type}-rating-logo" src="{{logo}}">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes">{{votes}}</div>
          </div>
        </div>
      </script>
      <li class="${type}-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($(`#${type}-rating-template`).html())
    let context = {
      'logo': logo,
      'rating': rating,
      'votes': votes
    }
    let compile = template(context)
    $(`.${type}-rating`).html(compile)
    console.log(`Ratings on Trakt: ${type} rating added`)
  }

  // get ratings
  function getRatings (data) {
    if (data && data.Response === 'True') {
      // IMDb
      if (data.imdbRating && data.imdbRating !== 'N/A' && data.imdbVotes && data.imdbVotes !== 'N/A') {
        let logo = 'https://ia.media-imdb.com/images/M/MV5BMTk3ODA4Mjc0NF5BMl5BcG5nXkFtZTgwNDc1MzQ2OTE@._V1_.png'
        let rating = data.imdbRating
        let votes = `${math.round((data.imdbVotes.replace(/,/g, '')) / 1000, 1)}k`
        console.log(`Ratings on Trakt: IMDb rating is "${rating}"`)
        console.log(`Ratings on Trakt: IMDb votes is "${votes}"`)
        addRating('IMDb', logo, rating, votes)
      }

      // Rotten Tomatoes
      if (data.Ratings[1] && data.Ratings[1] !== 'undefined' && data.Ratings[1].Source === 'Rotten Tomatoes' && data.Ratings[1].Value) {
        let rating = data.Ratings[1].Value
        let logo = getRottenTomatoesLogo(rating)
        let votes = getTomatometer(rating)
        console.log(`Ratings on Trakt: Tomatometer is "${rating}"`)
        addRating('Tomatometer', logo, rating, votes)
      }

      // Metacritic
      if (data.Metascore && data.Metascore !== 'N/A' && data.Metascore) {
        let logo = 'https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg'
        let rating = data.Metascore
        console.log(`Ratings on Trakt: Metascore is "${rating}"`)
        addRating('Metascore', logo, rating)
        addMetascoreBar(rating, color(rating))
      }
    }
  }

  // get data
  function getData () {
    GM_xmlhttpRequest({
      method: 'GET',
      url: `https://www.omdbapi.com/?apikey=${OMDbApikey()}&i=${IMDbID()}`,
      onload: function (response) {
        let data = JSON.parse(response.responseText)
        if (data && data.Response === 'False' && data.Error) { // error
          let error = `Ratings on Trakt: error "${data.Error}"`
          if (data.Error === 'Invalid API key!') { // if invalid API Key
            alert(error)
            GM_config.open()
          } else { // other errors
            console.log(error)
          }
        } else {
          getRatings(data)
        }
      }
    })
  }

  // get IMDb ID
  function IMDbID () {
    let link = $("a[href*='imdb']")
    if (link.length) {
      let IMDbID = link.attr('href').match(/tt\d+/)[0]
      console.log(`Ratings on Trakt: IMDb ID is "${IMDbID}"`)
      return IMDbID
    }
  }

  // get API Key
  function OMDbApikey () {
    let apikey = GM_config.get('apikey')
    if (apikey === '') {
      GM_config.open()
    } else {
      console.log(`Ratings on Trakt: OMDb API Key is "${apikey}"`)
      return apikey
    }
  }

  // add CSS
  function addCSS () {
    $('head').append(`
      <style type='text/css'>
        #summary-ratings-wrapper ul li {
          margin-right: 18px;
        }
        #summary-ratings-wrapper ul li:last-child {
          margin-right: 18px;
        }
        #summary-ratings-wrapper ul.stats {
          margin-left: 0px;
        }
        #summary-ratings-wrapper .summary-user-rating.popover-on {
          min-width: 0px;
        }
      </style>
    `)
    console.log('Ratings on Trakt: CSS added')
  }

  // settings
  GM_registerMenuCommand('Ratings on Trakt - Configure', function () {
    GM_config.open()
  })

  GM_config.init({
    'id': 'MyConfig',
    'title': 'Ratings on Trakt - Settings',
    'fields': {
      'apikey': {
        'label': 'OMDb API Key',
        'section': ['You can request a free OMDb API Key at:', 'https://www.omdbapi.com/apikey.aspx'],
        'type': 'text',
        'default': ''
      }
    },
    'events': {
      'save': function () {
        alert('Ratings on Trakt: Settings saved')
        location.reload()
      }
    }
  })
})()
