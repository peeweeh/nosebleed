// Hand ranking — evaluates best 5-card hand from 7 cards (hole + board).
// Returns a comparable score: higher = better hand.

import type { Card, Rank } from '@/types'
import { RANK_VALUE } from './deck'

export type HandRank =
  | 'royal-flush'
  | 'straight-flush'
  | 'four-of-a-kind'
  | 'full-house'
  | 'flush'
  | 'straight'
  | 'three-of-a-kind'
  | 'two-pair'
  | 'pair'
  | 'high-card'

export interface HandResult {
  rank: HandRank
  score: number   // numeric for comparison
  label: string
  bestFive: Card[]
}

export function evaluateBestHand(holeCards: [Card, Card], board: Card[]): HandResult {
  const all = [...holeCards, ...board]
  return bestOfCombinations(all)
}

function bestOfCombinations(cards: Card[]): HandResult {
  let best: HandResult | null = null
  const combos = combinations(cards, 5)
  for (const combo of combos) {
    const result = evaluateFive(combo)
    if (!best || result.score > best.score) best = result
  }
  return best!
}

function combinations(arr: Card[], k: number): Card[][] {
  if (k === 0) return [[]]
  if (arr.length < k) return []
  const [first, ...rest] = arr
  return [
    ...combinations(rest, k - 1).map(c => [first, ...c]),
    ...combinations(rest, k),
  ]
}

function evaluateFive(cards: Card[]): HandResult {
  const vals = cards.map(c => RANK_VALUE[c.rank]).sort((a, b) => b - a)
  const suits = cards.map(c => c.suit)
  const isFlush = suits.every(s => s === suits[0])
  const isStraight = checkStraight(vals)
  const counts = countRanks(vals)

  if (isFlush && isStraight && vals[0] === 14 && vals[4] === 10) {
    return { rank: 'royal-flush', score: 9_000_000, label: 'Royal Flush', bestFive: cards }
  }
  if (isFlush && isStraight) {
    return { rank: 'straight-flush', score: 8_000_000 + vals[0], label: 'Straight Flush', bestFive: cards }
  }
  if (counts[0] === 4) {
    return { rank: 'four-of-a-kind', score: 7_000_000 + groupScore(vals, counts), label: 'Four of a Kind', bestFive: cards }
  }
  if (counts[0] === 3 && counts[1] === 2) {
    return { rank: 'full-house', score: 6_000_000 + groupScore(vals, counts), label: 'Full House', bestFive: cards }
  }
  if (isFlush) {
    return { rank: 'flush', score: 5_000_000 + rankScore(vals), label: 'Flush', bestFive: cards }
  }
  if (isStraight) {
    return { rank: 'straight', score: 4_000_000 + vals[0], label: 'Straight', bestFive: cards }
  }
  if (counts[0] === 3) {
    return { rank: 'three-of-a-kind', score: 3_000_000 + groupScore(vals, counts), label: 'Three of a Kind', bestFive: cards }
  }
  if (counts[0] === 2 && counts[1] === 2) {
    return { rank: 'two-pair', score: 2_000_000 + groupScore(vals, counts), label: 'Two Pair', bestFive: cards }
  }
  if (counts[0] === 2) {
    return { rank: 'pair', score: 1_000_000 + groupScore(vals, counts), label: 'Pair', bestFive: cards }
  }
  return { rank: 'high-card', score: rankScore(vals), label: 'High Card', bestFive: cards }
}

function countRanks(vals: number[]): number[] {
  const freq: Record<number, number> = {}
  for (const v of vals) freq[v] = (freq[v] ?? 0) + 1
  return Object.values(freq).sort((a, b) => b - a)
}

function checkStraight(sortedVals: number[]): boolean {
  // Normal straight
  if (sortedVals[0] - sortedVals[4] === 4 && new Set(sortedVals).size === 5) return true
  // Wheel (A-2-3-4-5)
  const wheel = [14, 5, 4, 3, 2]
  return sortedVals.join() === wheel.join()
}

function rankScore(vals: number[]): number {
  return vals.reduce((acc, v, i) => acc + v * Math.pow(100, 4 - i), 0)
}

function groupScore(vals: number[], counts: number[]): number {
  // Weight by group size first, then kicker
  return vals.reduce((acc, v, i) => acc + v * Math.pow(100, 4 - i), 0)
}
