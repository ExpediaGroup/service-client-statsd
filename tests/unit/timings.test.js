'use strict'

const { assert } = require('chai')
const Timings = require('../../lib/timings')

describe('metrics: timings util', async () => {
  it('should calculate the time difference between a variety of phases (SUCCESS)', function () {
    const phases = {
      request: 100,
      end: 600
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 500
    })
  })

  it('should calculate the time difference between a variety of phases (ERROR)', function () {
    const phases = {
      request: 100,
      error: 550
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 450
    })
  })

  it('should handle when `socket` is not defined', function () {
    const phases = {
      request: 100,
      end: 600
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 500
    })
  })

  it('should handle when `lookup` is not defined (DNS is cached)', function () {
    const phases = {
      request: 100,
      end: 600
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 500
    })
  })

  it('should handle when `connect` is not defined', function () {
    const phases = {
      request: 100,
      end: 600
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 500
    })
  })

  it('should work for very fast operations (0 time difference)', function () {
    const phases = {
      request: 100,
      end: 100
    }

    const timings = Timings.calculate(phases)

    assert.deepEqual(timings, {
      total: 0
    })
  })
})
