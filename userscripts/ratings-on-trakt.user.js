// ==UserScript==
// @name            Ratings on Trakt
// @name:it         Valutazioni su Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds ratings from IMDb, Rotten Tomatoes and Metacritic to Trakt
// @description:it  Aggiunge valutazioni da IMDb, Rotten Tomatoes e Metacritic a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.0
// @icon            https://api.faviconkit.com/trakt.tv/64
// @homepageURL     https://git.io/Trakt-Userscripts
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/ratings-on-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/ratings-on-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @require         https://cdn.jsdelivr.net/npm/handlebars@4.0.12/dist/handlebars.min.js#sha256-qlku5J3WO/ehJpgXYoJWC2px3+bZquKChi4oIWrAKoI=
// @include         https://trakt.tv/*
// @connect         omdbapi.com
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

  // observe nodes
  NodeCreationObserver.onCreation('.shows #summary-wrapper .summary .container h1', ratingsOnTrakt)
  NodeCreationObserver.onCreation('.movies #summary-wrapper .summary .container h1', ratingsOnTrakt)

  function ratingsOnTrakt () {
    // run functions
    addCSS()
    addSettings()
    addRatings()
  }

  function addSettings () {
    // settings configuration
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
      'css': `
        #MyConfig {
          background-color: #1D1D1D;
          color: #FFF;
        }
        #MyConfig .reset,
        #MyConfig .reset a {
          color: #FFF;
        }
        #MyConfig .section_header {
          background-color: #3A3A3A;
          border: 1px solid #3A3A3A;
        }
        #MyConfig .section_desc {
          background-color: #3A3A3A;
          color: #FFF;
          border: 1px solid #3A3A3A;
        }
      `,
      'events': {
        'save': function () {
          alert('API Key saved')
          location.reload()
        }
      }
    })

    // add settings on add-on menu
    GM_registerMenuCommand('Ratings on Trakt - Configure', function () {
      GM_config.open()
    })

    // controll apikey
    if (GM_config.get('apikey') === '') {
      GM_config.open()
    }
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

  function addRottenTomatoesRating (logo, rating, tomato) {
    // add HTML structure
    $(`
      <script id="RottenTomatoes-rating-template" type="text/x-handlebars-template">
        <div class="rated-text">
          <div class="icon">
            <img class="RottenTomatoes logo" src="{{logo}}">
          </div>
          <div class="number">
            <div class="rating">{{rating}}</div>
            <div class="votes">{{tomato}}</div>
          </div>
        </div>
      </script>
      <li class="RottenTomatoes-rating"></li>
    `).appendTo($('#summary-ratings-wrapper .ratings'))

    // compile HTML structure
    let template = Handlebars.compile($('#RottenTomatoes-rating-template').html())
    let context = {
      'logo': logo,
      'rating': rating,
      'tomato': tomato
    }
    let compile = template(context)
    $('.RottenTomatoes-rating').html(compile)

    console.log('Ratings on Trakt: Rotten Tomatoes rating added')
  }

  function addMetacriticRating (rating, color) {
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
      'color': color
    }
    let compile = template(context)
    $('.Metacritic-rating').html(compile)

    console.log('Ratings on Trakt: Metacritic rating added')
  }

  function addRatings () {
    // get apikey
    let apikey = GM_config.get('apikey')
    console.log(`Ratings on Trakt: OMDb API Key is ${apikey}`)

    // get IMDb ID
    let IMDbID = $("a[href*='imdb']").attr('href').match(/tt\d+/)[0]
    console.log(`Ratings on Trakt: IMDb ID is ${IMDbID}`)

    // get ratings
    GM_xmlhttpRequest({
      method: 'GET',
      url: `http://www.omdbapi.com/?apikey=${apikey}&i=${IMDbID}`,
      onload: function (response) {
        let json = JSON.parse(response.responseText)
        // add IMDb ratings
        if (json && json.imdbRating && json.imdbRating !== 'N/A' && json.imdbVotes && json.imdbVotes !== 'N/A') {
          console.log(`Ratings on Trakt: IMDb rating is ${json.imdbRating}`)
          console.log(`Ratings on Trakt: IMDb votes is ${((json.imdbVotes.replace(/,/g, '')) / 1000).toFixed(1)}k`)
          addIMDbRating(json.imdbRating, ((json.imdbVotes.replace(/,/g, '')) / 1000).toFixed(1))
        } else {
          console.log('Ratings on Trakt: IMDb rating not available')
        }

        // add Rotten Tomatoes ratings
        if (json && json.Ratings[1] && json.Ratings[1] !== 'undefined' && json.Ratings[1].Source === 'Rotten Tomatoes' && json.Ratings[1].Value) {
          console.log(`Ratings on Trakt: Tomatometer is ${json.Ratings[1].Value}`)
          let tomatometer = 0
          let tomatoLogo = 0
          if (parseFloat(json.Ratings[1].Value) < 60) {
            tomatometer = 'Rotten'
            tomatoLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-rotten-lg.ecdfcf9596f.png'
          } else {
            tomatometer = 'Fresh'
            tomatoLogo = 'https://www.rottentomatoes.com/assets/pizza-pie/images/icons/global/new-fresh-lg.12e316e31d2.png'
          }
          console.log(`Ratings on Trakt: Rotten or Fresh? ${tomatometer}`)
          addRottenTomatoesRating(tomatoLogo, json.Ratings[1].Value, tomatometer)
        } else {
          console.log('Ratings on Trakt: Tomatometer not available')
        }

        // add Metacritic ratings
        if (json && json.Metascore && json.Metascore !== 'N/A' && json.Metascore < 40) {
          console.log(`Ratings on Trakt: Metascore is ${json.Metascore}`)
          addMetacriticRating(json.Metascore, '#FF0000')
        } else if (json && json.Metascore && json.Metascore !== 'N/A' && json.Metascore >= 40 && json.Metascore <= 60) {
          console.log(`Ratings on Trakt: Metascore is ${json.Metascore}`)
          addMetacriticRating(json.Metascore, '#FFCC33')
        } else if (json && json.Metascore && json.Metascore !== 'N/A' && json.Metascore > 60) {
          console.log(`Ratings on Trakt: Metascore is ${json.Metascore}`)
          addMetacriticRating(json.Metascore, '#66CC33')
        } else {
          console.log('Ratings on Trakt: Metascore not available')
        }

        // error
        if (json && json.Error) {
          console.log(`Ratings on Trakt: Error ${json.Error}`)
        }
      }
    })
  }

  function addCSS () {
    // add CSS
    $('head').append(`
      <style type='text/css'>
        #summary-ratings-wrapper ul li {
          margin: 0 19px 0 0;
        }
        #summary-ratings-wrapper ul.stats {
          margin-left: 19px;
        }
      </style>
    `)

    console.log('Ratings on Trakt: CSS added')
  }
})()
