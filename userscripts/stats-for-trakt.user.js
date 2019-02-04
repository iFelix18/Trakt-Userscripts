// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         1.0.0
// @icon            https://api.faviconkit.com/trakt.tv/64
// @homepageURL     https://git.io/Trakt-Userscripts
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.3.1/dist/jquery.min.js#sha256-FgpCb/KJQlLNfOu91ta32o/NMZxltwRo8QtmkMRdAu8=
// @require         https://cdn.jsdelivr.net/npm/mathjs@5.4.2/dist/math.min.js#sha256-W2xP+GeD3rATAAJ/rtjz0uNLqO9Ve9yk9744ImX8GWY=
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.0.1/dist/progressbar.min.js#sha256-VupM2GVVXK2c3Smq5LxXjUHBZveWTs35hu1al6ss6kk=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @include         https://trakt.tv/*
// @run-at          document-idle
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  // observe node
  NodeCreationObserver.onCreation('.people #summary-wrapper .summary .container h1', statsForTrakt)

  function statsForTrakt () {
    // run functions
    addHTML()
    addCSS()
    addClass()
    getStats()
  }

  function addHTML () {
    // add HTML structure
    $(`
      <h2 id="peopleStats">
        <strong>Stats</strong>
        <div style="clear:both;"></div>
        <div class="containerProgressbar">
          <div id="progressbarStats"></div>
        </div>
        <div style="clear:both;"></div>
      </h2>
    `).insertBefore($('.people #info-wrapper h2:first-of-type'))

    console.log('Stats for Trakt: HTML added')
  }

  function addClass () {
    // add classes by role
    $('.posters').each(function () {
      $(this).addClass($(this).prev().attr('id'))
    })

    console.log('Stats for Trakt: role classes added')

    // add classes for unreleased items
    $('.posters .grid-item h4:first-of-type:contains("\u00a0")').each(function () {
      $(this).parent().parent().parent().addClass('unreleased')
    })

    console.log('Stats for Trakt: unreleased classes added')
  }

  function getStats () {
    // get role
    $('.people .info h2').each(function () {
      let role = this.id

      if (role !== 'peopleStats') {
        // get not unreleased items for role
        let items = $(`.posters.${role} .grid-item:not(.unreleased)`).length
        // get not unreleased watched items for role
        let watchedItems = $(`.posters.${role} .grid-item:not(.unreleased) .watch.selected`).length
        // calculate progress
        let watchedProgressItems = math.round((watchedItems / items) * 100)
        // if progress is minor of 10
        if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems < 10) {
          console.log(`Stats for Trakt: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
          addProgressbar(`0.0${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
        } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems >= 10 && watchedProgressItems <= 99) { // if progress is from 10 to 99
          console.log(`Stats for Trakt: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
          addProgressbar(`0.${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
        } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems === 100) { // if progress is 100
          console.log(`Stats for Trakt: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
          addProgressbar('1.0', `${role}`, watchedItems, `${watchedProgressItems}%`, items)
        }
      }
    })
  }

  function addProgressbar (state, role, watched, percentage, total) {
    // progressbar.js configuration
    let progressbar = new ProgressBar.Line(progressbarStats, {
      color: '#ED1C24',
      strokeWidth: 2,
      trailColor: '#530D0D',
      text: {
        value: `${role}: watched ${watched} (${percentage}) items out of a total of ${total}.`,
        style: {
          color: '#333',
          margin: '1px 0 5px',
          font: '14px varela round, helvetica neue, Helvetica, Arial, sans-serif'
        }
      }
    })

    // add progressbar
    progressbar.set(state)

    console.log(`Stats for Trakt: ${role} progressbar added`)
  }

  function addCSS () {
    // add CSS
    $('head').append(`
      <style type='text/css'>
        .progressbar-text:first-letter {
          text-transform: capitalize;
        }
        @media (min-width: 992px) {
          .containerProgressbar {
            width: 66.6666666667%;
            float: left;
            display: block;
          }
        }
      </style>
    `)

    console.log('Stats for Trakt: CSS added')
  }
}())
