// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.0.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377524-stats-for-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Stats_for_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/mathjs@6.0.2/dist/math.min.js#sha256-V3DeZ7u2Gzw4BsHgnjSqiMUJVScBb2Je/+oMck2V4QQ=
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.0.1/dist/progressbar.min.js#sha256-VupM2GVVXK2c3Smq5LxXjUHBZveWTs35hu1al6ss6kk=
// @require         https://cdn.jsdelivr.net/npm/chart.js@2.8.0/dist/Chart.min.js#sha256-Uv9BNBucvCPipKQ2NS9wYpJmi8DTOEfTA/nH2aoJALw=
// @require         https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.2/jquery.scrollTo.min.js#sha256-7QS1cHsH75h3IFgrFKsdhmKHHpWqF82sb/9vNLqcqs0=
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@master/release/node-creation-observer-1.2.js
// @match           *://trakt.tv/*
// @grant           GM_info
// @run-at          document-idle
// @inject-into     content
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

(function () {
  'use strict'

  /* global $, math, ProgressBar, statsProgressbar, Chart, NodeCreationObserver */

  console.log(`${GM_info.script.name} v${GM_info.script.version} by ${GM_info.script.author}`)

  // Node Creation Observer
  NodeCreationObserver.init('observed-stats')
  NodeCreationObserver.onCreation('.people #summary-wrapper .summary .container h1', function () {
    addCSS()
    addProgressbarStructure()
    addToMenu()
    getPeopleStats()
  })
  NodeCreationObserver.onCreation('.people #toast-container .toast.toast-success', function () {
    removePeopleStats()
    getPeopleStats()
  })
  NodeCreationObserver.onCreation('.shows:not(.season):not(.episode) .season-posters', function () {
    addChartStructure()
    addToMenu()
    getSeriesStats()
  })

  // remove old stats
  function removePeopleStats () {
    $('#statsProgressbar').children().remove()
    console.log(`${GM_info.script.name}: stats removed`)
  }

  // progressbar.js
  function addProgressbar (progress, role, watched, percentage, total) {
    let progressbar = new ProgressBar.Line(statsProgressbar, { // progressbar.js configuration
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
    progressbar.setText(`${role}: watched ${watched} (${percentage}) items out of a total of ${total}.`)
    console.log(`${GM_info.script.name}: ${role} progressbar added`)
  }

  // Chart.js
  function addChart (labels, dataset) {
    let data = { // Chart.js data
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
    let options = { // Chart.js options
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
    console.log(`${GM_info.script.name}: chart added`)
  }

  // get stats
  function getPeopleStats () {
    addClass()
    $('.people .info h2').each(function () { // get role
      let role = this.id
      let items = $(`.posters.${role} .grid-item:not(.unreleased)`).length // get not unreleased items for role
      let watchedItems = $(`.posters.${role} .grid-item:not(.unreleased) .watch.selected`).length // get not unreleased watched items for role
      let watchedProgressItems = math.round((watchedItems / items) * 100) // calculate progress
      if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems < 10) { // if progress is minor of 10
        console.log(`${GM_info.script.name}: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.0${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems >= 10 && watchedProgressItems <= 99) { // if progress is from 10 to 99
        console.log(`${GM_info.script.name}: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems === 100) { // if progress is 100
        console.log(`${GM_info.script.name}: ${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar('1.0', `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      }
    })
  }
  function getSeriesStats () {
    let json = []
    let labels = []
    let dataset = []
    $('.shows:not(.season):not(.episode) .season-posters .grid-item').each(function () {
      let seasonNumber = $(this).data('season-number') // get season number
      let rating = $(this).data('percentage') // get Trakt rating
      let data = {
        rating: rating
      }
      json[seasonNumber] = data
    })
    for (let i = 1; i < json.length; i++) { // seasons rating excluding 0
      labels.push(`Season ${i}`) // labels for chart
      dataset.push(json[i].rating) // dataset for chart
    }
    console.log(`${GM_info.script.name}: ${labels}`)
    console.log(`${GM_info.script.name}: ${dataset}`)
    addChart(labels, dataset) // add chart
  }

  // add class
  function addClass () {
    $('.posters').each(function () { // by role
      $(this).addClass($(this).prev().attr('id'))
    })
    console.log(`${GM_info.script.name}: role classes added`)
    $('.posters .grid-item h4:first-of-type:contains("\u00a0")').each(function () { // for unreleased items
      $(this).parent().parent().parent().addClass('unreleased')
    })
    console.log(`${GM_info.script.name}: unreleased classes added`)
  }

  // add stats to sidebar menu
  function addToMenu () {
    $('#info-wrapper .sidebar .sections li:first-of-type a').parent().after(`
      <li>
        <a href="#stats">Stats</a>
      </li>
    `)
    $('#info-wrapper .sidebar .sections li a[href="#stats"]').click(function (event) {
      event.preventDefault()
      $.scrollTo('#stats', 1000, {
        offset: -70
      })
    })
    console.log(`${GM_info.script.name}: stats add to menu`)
  }

  // add structure
  function addProgressbarStructure () {
    let HTML = `<h2 id="stats">
                  <strong>Stats</strong>
                  <div style="clear:both;"></div>
                  <div class="statsContainer col-lg-8 col-md-7">
                    <div id="statsProgressbar"></div>
                  </div>
                  <div style="clear:both;"></div>
                </h2>`
    $(HTML).insertBefore($('.people #info-wrapper h2:first-of-type'))
    console.log(`${GM_info.script.name}: progressbar structure added`)
  }
  function addChartStructure () {
    let HTML = `<h2 id="stats">
                  <strong>Stats</strong>
                  <div style="clear:both;"></div>
                  <div class="statsContainer col-lg-8 col-md-7">
                    <canvas id="statsChart"></canvas>
                  </div>
                  <div style="clear:both;"></div>
                </h2>`
    $(HTML).insertBefore($('#info-wrapper #activity'))
    console.log(`${GM_info.script.name}: chart structure added`)
  }

  // add CSS
  function addCSS () {
    $('head').append(`
      <style type='text/css'>
        .progressbar-text:first-letter {
          text-transform: capitalize;
        }
      </style>
    `)
    console.log(`${GM_info.script.name}: CSS added`)
  }
}())
