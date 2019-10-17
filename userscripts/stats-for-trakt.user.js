// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.3
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377524-stats-for-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Stats_for_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/mathjs@6.2.3/dist/math.min.js#sha256-jnrFf6CiZ2veyKUaL7l7FHWW/ela8txaw/J7SVZzW5o=
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.0.1/dist/progressbar.min.js#sha256-VupM2GVVXK2c3Smq5LxXjUHBZveWTs35hu1al6ss6kk=
// @require         https://cdn.jsdelivr.net/npm/chart.js@2.8.0/dist/Chart.min.js#sha256-Uv9BNBucvCPipKQ2NS9wYpJmi8DTOEfTA/nH2aoJALw=
// @require         https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.2/jquery.scrollTo.min.js#sha256-7QS1cHsH75h3IFgrFKsdhmKHHpWqF82sb/9vNLqcqs0=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@edabdee1caaee6af701333a527a0afd95240aa3b/release/node-creation-observer-latest.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@a4a49b47ecfb1d8fcd27049cc0e8114d05522a0f/gm_config.min.js
// @match           *://trakt.tv/*
// @grant           GM_info
// @grant           GM_setValue
// @grant           GM_getValue
// @grant           GM_registerMenuCommand
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global $, math, ProgressBar, statsProgressbar, Chart, NodeCreationObserver, GM_config */

(() => {
  'use strict'

  console.log(`${GM_info.script.name} v${GM_info.script.version} by Felix is running!`)

  // configuration
  GM_config.init({
    id: 'trakt-config',
    title: `${GM_info.script.name} Settings`,
    fields: {
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
  NodeCreationObserver.init('observed-stats')
  NodeCreationObserver.onCreation('.people #summary-wrapper .summary .container h1', () => {
    addCSS()
    addProgressbarStructure()
    addToMenu()
    getPeopleStats()
  })
  NodeCreationObserver.onCreation('.people #toast-container .toast.toast-success', () => {
    removePeopleStats()
    getPeopleStats()
  })
  NodeCreationObserver.onCreation('.shows:not(.season):not(.episode) .season-posters', () => {
    addChartStructure()
    addToMenu()
    getSeriesStats()
  })

  // remove old stats
  function removePeopleStats () {
    $('#statsProgressbar').children().remove()
    log('stats removed')
  }

  // progressbar.js
  function addProgressbar (progress, role, watched, percentage, total) {
    const progressbar = new ProgressBar.Line(statsProgressbar, { // progressbar.js configuration
      color: '#ed1c24',
      strokeWidth: 2,
      trailColor: '#530d0d',
      text: {
        style: {
          color: 'inherit',
          margin: '1px 0 5px',
          font: '14px varela round, helvetica neue, Helvetica, Arial, sans-serif'
        }
      }
    })
    progressbar.set(progress)
    progressbar.setText(`${role}: watched ${watched} (${percentage}) out of a total of ${total} released items.`)
    log(`${role} progressbar added`)
  }

  // Chart.js
  function addChart (labels, dataset) {
    const data = { // Chart.js data
      labels: labels,
      datasets: [{
        backgroundColor: 'transparent',
        borderColor: '#ed1c24',
        borderWidth: 4,
        data: dataset,
        fill: false,
        label: 'Rating',
        lineTension: 0,
        pointBackgroundColor: '#ed1c24'
      }]
    }
    const options = { // Chart.js options
      legend: {
        display: false
      },
      responsive: true,
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: false
          }
        }]
      },
      title: {
        display: true,
        position: 'top',
        fontSize: 14,
        fontFamily: 'varela round, helvetica neue, Helvetica, Arial, sans-serif',
        fontStyle: 'normal',
        padding: 5,
        lineHeight: 'normal',
        text: 'Seasons ratings from Trakt'
      }
    }
    let myChart = new Chart($('#statsChart'), { //eslint-disable-line
      type: 'line',
      data: data,
      options: options
    })
    log('chart added')
  }

  // get stats
  function getPeopleStats () {
    addUnreleasedClass()
    $('.posters').each(function () { // get role
      const role = $(this).data('role')
      const items = $(`.posters[data-role="${role}"] .grid-item:not(.unreleased)`).length // get not unreleased items by role
      const watchedItems = $(`.posters[data-role="${role}"] .grid-item:not(.unreleased) .watch.selected`).length // get not unreleased watched items by role
      const watchedProgressItems = math.round((watchedItems / items) * 100) // calculate progress
      if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems < 10) { // if progress is minor of 10
        log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.0${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems >= 10 && watchedProgressItems <= 99) { // if progress is from 10 to 99
        log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems === 100) { // if progress is 100
        log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar('1.0', `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      }
    })
  }
  function getSeriesStats () {
    const json = []
    const labels = []
    const dataset = []
    $('.shows:not(.season):not(.episode) .season-posters .grid-item').each(function () {
      const seasonNumber = $(this).data('season-number') // get season number
      const rating = $(this).data('percentage') // get Trakt rating
      const data = {
        rating: rating
      }
      json[seasonNumber] = data
    })
    for (let i = 1; i < json.length; i++) { // seasons rating excluding 0
      labels.push(`Season ${i}`) // labels for chart
      dataset.push(json[i].rating) // dataset for chart
    }
    log(labels)
    log(dataset)
    addChart(labels, dataset) // add chart
  }

  // add unreleased class
  function addUnreleasedClass () {
    $('.posters .grid-item h4:first-of-type:contains("\u00a0")').each(function () {
      $(this).parent().parent().parent().addClass('unreleased')
    })
    log('unreleased classes added')
  }

  // add stats to sidebar menu
  function addToMenu () {
    $('#info-wrapper .sidebar .sections li:first-of-type a').parent().after('<li><a href="#stats">Stats</a></li>')
    $('#info-wrapper .sidebar .sections li a[href="#stats"]').click(event => {
      event.preventDefault()
      $.scrollTo('#stats', 1000, {
        offset: -70
      })
    })
    log('stats added to menu')
  }

  // add structure
  function addProgressbarStructure () {
    const HTML = '<h2 id="stats"><strong>Stats</strong><div style="clear:both;"></div><div class="statsContainer col-lg-8 col-md-7"><div id="statsProgressbar"></div></div><div style="clear:both;"></div></h2>'
    $(HTML).insertBefore($('.people #info-wrapper h2:first-of-type'))
    log('progressbar structure added')
  }
  function addChartStructure () {
    const HTML = '<h2 id="stats"><strong>Stats</strong><div style="clear:both;"></div><div class="statsContainer col-lg-8 col-md-7"> <canvas id="statsChart"></canvas></div><div style="clear:both;"></div></h2>'
    $(HTML).insertBefore($('#info-wrapper #activity'))
    log('chart structure added')
  }

  // add CSS
  function addCSS () {
    const CSS = '<style type="text/css">.progressbar-text:first-letter{text-transform:capitalize}</style>'
    $('head').append(CSS)
    log('CSS added')
  }
})()
