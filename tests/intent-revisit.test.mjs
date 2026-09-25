import assert from 'node:assert/strict'
import test from 'node:test'
import {
  shouldReportIndexRevisit,
  shouldReportVideoRevisit,
} from '../miniprogram/utils/intent-revisit.ts'

test('multi-image and pdf revisit only after the content is finished', () => {
  assert.equal(shouldReportIndexRevisit({
    completed: false,
    previousIndex: 3,
    nextIndex: 1,
    alreadyReported: false,
  }), false)

  assert.equal(shouldReportIndexRevisit({
    completed: true,
    previousIndex: 3,
    nextIndex: 1,
    alreadyReported: false,
  }), true)

  assert.equal(shouldReportIndexRevisit({
    completed: true,
    previousIndex: 1,
    nextIndex: 2,
    alreadyReported: false,
  }), false)

  assert.equal(shouldReportIndexRevisit({
    completed: true,
    previousIndex: 3,
    nextIndex: 1,
    alreadyReported: true,
  }), false)
})

test('video revisit only after progress passes 80 percent and time moves back', () => {
  assert.equal(shouldReportVideoRevisit({
    peakProgress: 80,
    peakTimeSec: 40,
    nextTimeSec: 10,
    alreadyReported: false,
  }), false)

  assert.equal(shouldReportVideoRevisit({
    peakProgress: 81,
    peakTimeSec: 40,
    nextTimeSec: 39,
    alreadyReported: false,
  }), true)

  assert.equal(shouldReportVideoRevisit({
    peakProgress: 90,
    peakTimeSec: 50,
    nextTimeSec: 49.5,
    alreadyReported: false,
  }), false)

  assert.equal(shouldReportVideoRevisit({
    peakProgress: 90,
    peakTimeSec: 50,
    nextTimeSec: 20,
    alreadyReported: true,
  }), false)
})
