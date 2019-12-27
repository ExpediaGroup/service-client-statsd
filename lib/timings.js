/*
Copyright 2019 Expedia Group, Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict'

/**
 * Determine elapsed times in ms between two timestamps
 * @private
 * @param {object} phases - Object of all phase information.
 * @param {string} endName - Phase name to end at.
 * @param {string} startName - Phase name to start at.
 * @return {number|null} - Returns the elapsed time in ms between the two phases or null if unable to calculate.
 */
function elapsedBetweenPhases (phases, endName, startName) {
  const start = phases[startName]
  const end = phases[endName]
  if (typeof start !== 'number' || typeof end !== 'number') {
    return null
  }
  return end - start
}

/**
 * Calculate phase alias timings.
 *     total: Elapsed ms between starting and finishing the request.
 * @private
 * @param {object} phases - Object of all phase information.
 * @return {object} - Object containing phase alias timings.
 */
function calculate (phases) {
  let total = elapsedBetweenPhases(phases, 'end', 'request')
  if (typeof total !== 'number') {
    total = elapsedBetweenPhases(phases, 'error', 'request')
  }

  return {
    total
  }
}

module.exports = {
  calculate
}
