// ==UserScript==
// @name            Stats for Trakt
// @name:it         Statistiche per Trakt
// @author          Felix
// @namespace       https://github.com/iFelix18
// @description     Adds stats on Trakt
// @description:it  Aggiunge statistiche a Trakt
// @copyright       2019, Felix (https://github.com/iFelix18)
// @license         MIT
// @version         2.2.0
// @homepageURL     https://git.io/Trakt-Userscripts
// @homepageURL     https://greasyfork.org/scripts/377524-stats-for-trakt
// @homepageURL     https://openuserjs.org/scripts/iFelix18/Stats_for_Trakt
// @supportURL      https://github.com/iFelix18/Trakt-Userscripts/issues
// @updateURL       https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/meta/stats-for-trakt.meta.js
// @downloadURL     https://raw.githubusercontent.com/iFelix18/Trakt-Userscripts/master/userscripts/stats-for-trakt.user.js
// @require         https://cdn.jsdelivr.net/gh/greasemonkey/gm4-polyfill@master/gm4-polyfill.min.js
// @require         https://cdn.jsdelivr.net/gh/sizzlemctwizzle/GM_config@master/gm_config.min.js
// @require         https://cdn.jsdelivr.net/gh/soufianesakhi/node-creation-observer-js@master/release/node-creation-observer-1.2.min.js
// @require         https://cdn.jsdelivr.net/gh/iFelix18/Userscripts@master/lib/utils/utils.min.js
// @require         https://cdn.jsdelivr.net/npm/jquery@3.4.1/dist/jquery.min.js#sha256-CSXorXvZcTkaix6Yvo6HppcZGetbYMGWSFlBw8HfCJo=
// @require         https://cdn.jsdelivr.net/npm/mathjs@6.2.3/dist/math.min.js#sha256-jnrFf6CiZ2veyKUaL7l7FHWW/ela8txaw/J7SVZzW5o=
// @require         https://cdn.jsdelivr.net/npm/progressbar.js@1.1.0/dist/progressbar.min.js#sha256-c83qPqBpH5rEFQvgyTfcLufqoQIFFoqE5B71yeBXhLc=
// @require         https://cdn.jsdelivr.net/npm/chart.js@2.9.3/dist/Chart.min.js#sha256-R4pqcOYV8lt7snxMQO/HSbVCFRPMdrhAFMH+vr9giYI=
// @require         https://cdn.jsdelivr.net/npm/jquery.scrollto@2.1.2/jquery.scrollTo.min.js#sha256-7QS1cHsH75h3IFgrFKsdhmKHHpWqF82sb/9vNLqcqs0=
// @match           *://trakt.tv/*
// @grant           GM.getValue
// @grant           GM_getValue
// @grant           GM.setValue
// @grant           GM_setValue
// @grant           GM.info
// @grant           GM_info
// @grant           GM.registerMenuCommand
// @grant           GM_registerMenuCommand
// @run-at          document-idle
// @inject-into     page
// ==/UserScript==
//
// Recommended in combination with Darkt, my darker theme for Trakt.
// More info on: https://git.io/Darkt

/* global GM_config, NodeCreationObserver, MonkeyUtils, $, math, ProgressBar, Chart */

(() => {
  'use strict'

  //* GM_config
  GM_config.init({
    id: 'trakt-config',
    title: `${GM.info.script.name} v${GM.info.script.version} Settings`,
    fields: {
      logging: {
        label: 'Logging',
        section: ['Develop'],
        labelPos: 'above',
        type: 'checkbox',
        default: false
      }
    },
    css: '#trakt-config{background-color:#343434;color:#fff}#trakt-config *{font-family:varela round,helvetica neue,Helvetica,Arial,sans-serif}#trakt-config .section_header{background-color:#282828;border:1px solid #282828;border-bottom:none;color:#fff;font-size:10pt}#trakt-config .section_desc{background-color:#282828;border:1px solid #282828;border-top:none;color:#fff;font-size:10pt}#trakt-config .reset{color:#fff}',
    events: {
      save: () => {
        window.alert(`${GM.info.script.name}: settings saved`)
        GM_config.close()
        window.location.reload(false)
      }
    }
  })
  GM.registerMenuCommand('Configure', () => GM_config.open())

  //* MonkeyUtils
  const MU = new MonkeyUtils({
    name: GM.info.script.name,
    version: GM.info.script.version,
    author: 'Felix',
    color: '#ed1c24',
    logging: GM_config.get('logging')
  })
  MU.init('trakt-config')

  //* functions
  const addStyle = () => { // add style
    const css = '<style type="text/css">.progressbar-text:first-letter{text-transform:capitalize}</style>'
    $('head').append(css)
    MU.log('style added')
  }
  const addProgressbarStructure = () => { // add progressbar structure
    const HTML = '<h2 id="stats"><strong>Stats</strong><div style="clear:both;"></div><div class="statsContainer col-lg-8 col-md-7"><div id="statsProgressbar"></div></div><div style="clear:both;"></div></h2>'
    $(HTML).insertBefore($('.people #info-wrapper h2:first-of-type'))
    MU.log('progressbar structure added')
  }
  const addToMenu = () => { // add stats to sidebar menu
    $('#info-wrapper .sidebar .sections li:first-of-type a').parent().after('<li><a href="#stats">Stats</a></li>')
    $('#info-wrapper .sidebar .sections li a[href="#stats"]').click(event => {
      event.preventDefault()
      $.scrollTo('#stats', 1000, {
        offset: -70
      })
    })
    MU.log('stats added to menu')
  }
  const addUnreleasedClass = () => { // add unreleased class
    $('.posters .grid-item h4:first-of-type:contains("\u00a0")').each(function () {
      $(this).parent().parent().parent().addClass('unreleased')
    })
    MU.log('unreleased classes added')
  }
  const addProgressbar = (progress, role, watched, percentage, total) => { // add progressbar
    const progressbar = new ProgressBar.Line('#statsProgressbar', { // progressbar.js configuration
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
    MU.log(`${role} progressbar added`)
  }
  const getPeopleStats = () => { // get people stats
    addUnreleasedClass()
    $('.posters').each(function () { // get role
      const role = $(this).data('role')
      const items = $(`.posters[data-role="${role}"] .grid-item:not(.unreleased)`).length // get not unreleased items by role
      const watchedItems = $(`.posters[data-role="${role}"] .grid-item:not(.unreleased) .watch.selected`).length // get not unreleased watched items by role
      const watchedProgressItems = math.round((watchedItems / items) * 100) // calculate progress
      if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems < 10) { // if progress is minor of 10
        MU.log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.0${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems >= 10 && watchedProgressItems <= 99) { // if progress is from 10 to 99
        MU.log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar(`0.${watchedProgressItems}`, `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      } else if (items > 0 && watchedProgressItems !== 'NaN' && watchedProgressItems === 100) { // if progress is 100
        MU.log(`${items} ${role} items, including ${watchedItems} (${watchedProgressItems}%) seen.`)
        addProgressbar('1.0', `${role}`, watchedItems, `${watchedProgressItems}%`, items)
      }
    })
  }
  const addChartStructure = () => { // add chart structure
    const HTML = '<h2 id="stats"><strong>Stats</strong><div style="clear:both;"></div><div class="statsContainer col-lg-8 col-md-7"> <canvas id="statsChart"></canvas></div><div style="clear:both;"></div></h2>'
    $(HTML).insertBefore($('#info-wrapper #activity'))
    MU.log('chart structure added')
  }
  const removePeopleStats = () => { // remove old stats
    $('#statsProgressbar').children().remove()
    MU.log('stats removed')
  }
  const addChart = (labels, dataset) => { // add chart
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
    const myChart = new Chart($('#statsChart'), { // eslint-disable-line
      type: 'line',
      data: data,
      options: options
    })
    MU.log('chart added')
  }
  const getSeriesStats = () => { // get series stats
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
    MU.log(labels)
    MU.log(dataset)
    addChart(labels, dataset) // add chart
  }

  //* NodeCreationObserver
  NodeCreationObserver.init('observed-stats')
  NodeCreationObserver.onCreation('.people #summary-wrapper .summary .container h1', () => {
    addStyle()
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
})()
