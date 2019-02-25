// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds ratings from IMDb, Rotten Tomatoes, Metacritic and MyAnimeList to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes, Metacritic e MyAnimeList a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.2.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377523-ratings-on-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Ratings_on_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @require         https://cdn.jsdelivr.net/npm/mathjs@5.4.2/dist/math.min.js#sha256-W2xP+GeD3rATAAJ/rtjz0uNLqO9Ve9yk9744ImX8GWY=
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.0.12/dist/handlebars.min.js#sha256-qlku5J3WO/ehJpgXYoJWC2px3+bZquKChi4oIWrAKoI=
// @require         https://cdn.jsdelivr.net/gh/cvzi/RequestQueue@e4297b3c2e11761d69858bad4746832ea412b571/RequestQueue.min.js
// @include         https://trakt.tv/*
// @connect         omdbapi.com
// @connect         api.simkl.com
// @grant           GM_getValue
// @grant           GM_setValue
// @grant           GM_registerMenuCommand
// @grant           GM_xmlhttpRequest
// @run-at          document-start
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global NodeCreationObserver, $, Handlebars, math, GM_config, RequestQueue */

  // observe node
  NodeCreationObserver.init('observed-ratings')
  NodeCreationObserver.onCreation('.movies #summary-wrapper .summary .container h1, .shows #summary-wrapper .summary .container h1', function () {
    addCSS()
    getRatings()
  })

  // get Metacritic color
  function getMetascoreColor (rating) {
    let color = 0
    if (rating < 40) {
      color = '#FF0000'
    } else if (rating >= 40 && rating <= 60) {
      color = '#FFCC33'
    } else if (rating > 60) {
      color = '#66CC33'
    }
    return color
  }

  // get Fresh or Rotten
  function getTomatometer (rating) {
    let tomatometer = 0
    if (parseFloat(rating) < 60) {
      tomatometer = 'Rotten'
    } else {
      tomatometer = 'Fresh'
    }
    return tomatometer
  }

  // get RottenTomatoes Logo
  function getRottenTomatoesLogo (rating) {
    let tomatoLogo = 0
    if (parseFloat(rating) < 60) {
      tomatoLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
    } else {
      tomatoLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
    }
    return tomatoLogo
  }

  // add ratings
  function addMALRating (rating, votes) {
    // add HTML structure
    $(`
      <script id="MAL-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="MAL logo" src="https://myanimelist.cdn-dena.com/img/sp/icon/apple-touch-icon-256.png">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes">{{votes}}k</div>
          </div>
        </div>
      </script>
      <li class="MAL-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($('#MAL-rating-template').html())
    let context = {
      'rating': rating,
      'votes': votes
    }
    let compile = template(context)
    $('.MAL-rating').html(compile)
    console.log('Ratings on Trakt: MAL rating added')
  }

  function addMetacriticRating (rating) {
    // add HTML structure
    $(`
      <script id="Metacritic-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="Metacritic logo" src="https://upload.wikimedia.org/wikipedia/commons/2/20/Metacritic.svg">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes" style="margin-top: 4px; height: 6px; width: 100%; background-color: rgba(0, 0, 0, 0.5);">
              <div class="bar" style="height: 6px; width: {{rating}}%; background-color: {{color}};"></div>
            </div>
          </div>
        </div>
      </script>
      <li class="Metacritic-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($('#Metacritic-rating-template').html())
    let context = {
      'rating': rating,
      'color': getMetascoreColor(rating)
    }
    let compile = template(context)
    $('.Metacritic-rating').html(compile)
    console.log('Ratings on Trakt: Metacritic rating added')
  }

  function addRottenTomatoesRating (rating) {
    // add HTML structure
    $(`
      <script id="RottenTomatoes-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="RottenTomatoes logo" src="{{logo}}">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes">{{tomatometer}}</div>
          </div>
        </div>
      </script>
      <li class="RottenTomatoes-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($('#RottenTomatoes-rating-template').html())
    let context = {
      'logo': getRottenTomatoesLogo(rating),
      'rating': rating,
      'tomatometer': getTomatometer(rating)
    }
    let compile = template(context)
    $('.RottenTomatoes-rating').html(compile)
    console.log('Ratings on Trakt: Rotten Tomatoes rating added')
  }

  function addIMDbRating (rating, votes) {
    // add HTML structure
    $(`
      <script id="IMDb-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="IMDb logo" src="https://ia.media-imdb.com/images/M/MV5BMTk3ODA4Mjc0NF5BMl5BcG5nXkFtZTgwNDc1MzQ2OTE@._V1_.png">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes">{{votes}}k</div>
          </div>
        </div>
      </script>
      <li class="IMDb-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($('#IMDb-rating-template').html())
    let context = {
      'rating': rating,
      'votes': votes
    }
    let compile = template(context)
    $('.IMDb-rating').html(compile)
    console.log('Ratings on Trakt: IMDb rating added')
  }

  function addRatings (json) {
    if (json && json.Response === 'True') {
      // IMDb
      if (json.imdbRating && json.imdbRating !== 'N/A' && json.imdbVotes && json.imdbVotes !== 'N/A') {
        let rating = json.imdbRating
        let votes = math.round((json.imdbVotes.replace(/,/g, '')) / 1000, 1)
        console.log(`Ratings on Trakt: IMDb rating is "${rating}"`)
        console.log(`Ratings on Trakt: IMDb votes is "${votes}k"`)
        addIMDbRating(rating, votes)
      }

      // Rotten Tomatoes
      if (json.Ratings[1] && json.Ratings[1] !== 'undefined' && json.Ratings[1].Source === 'Rotten Tomatoes' && json.Ratings[1].Value) {
        let rating = json.Ratings[1].Value
        console.log(`Ratings on Trakt: Tomatometer is "${rating}"`)
        addRottenTomatoesRating(rating)
      }

      // Metacritic
      if (json.Metascore && json.Metascore !== 'N/A' && json.Metascore) {
        let rating = json.Metascore
        console.log(`Ratings on Trakt: Metascore is "${rating}"`)
        addMetacriticRating(rating)
      }
    }

    // MyAnimeList
    if (json && json.MAL) {
      let rating = json.MAL.rating
      let votes = math.round((json.MAL.votes) / 1000, 1)
      console.log(`Ratings on Trakt: MAL rating is "${rating}"`)
      console.log(`Ratings on Trakt: MAL votes is "${votes}k"`)
      addMALRating(rating, votes)
    }
  }

  // get ratings
  function getRatings () {
    let rq = new RequestQueue(1)
    let apikey = OMDbApikey()
    let id = IMDbID()
    console.log(`Ratings on Trakt: OMDb API Key is "${apikey}"`)
    console.log(`Ratings on Trakt: IMDb ID is "${id}"`)
    rq.add({
      method: 'GET',
      url: `https://www.omdbapi.com/?apikey=${apikey}&i=${id}`,
      onload: function (response) {
        let json = JSON.parse(response.responseText)
        if (json && json.Response === 'False' && json.Error) { // error
          let message = `Ratings on Trakt: error "${json.Error}"`
          if (json.Error === 'No API key provided.' || json.Error === 'Invalid API key!') { // if invalid API Key
            alert(message)
            GM_config.open()
          } else { // other errors
            console.log(message)
          }
        } else {
          addRatings(json)
        }
      }
    })
    rq.add({
      method: 'GET',
      url: `https://api.simkl.com/ratings?imdb=${id}&fields=ext`,
      onload: function (response) {
        let json = JSON.parse(response.responseText)
        if (json) {
          addRatings(json)
        }
      }
    })
  }

  // get IMDb ID
  function IMDbID () {
    let link = $("a[href*='imdb']")
    if (link.length) {
      return link.attr('href').match(/tt\d+/)[0]
    }
  }

  // get API Key
  function OMDbApikey () {
    return GM_config.get('apikey')
  }

  // add CSS
  function addCSS () {
    $('head').append(`
      <style type='text/css'>
        #summary-ratings-wrapper ul li {
          margin-right: 19px;
        }
        #summary-ratings-wrapper ul li:last-child {
          margin-right: 19px;
        }
        #summary-ratings-wrapper ul.stats {
          margin-left: 0px;
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
