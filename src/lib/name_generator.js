import { rand_between, sentence_case } from './utils.js'

/**
 * Returns a random element from an array of words.
 * @param {string[]} words
 * @returns {string}
 */
function get_random(words) {
  const randomIndex = Math.floor(Math.random() * words.length)
  return words[randomIndex]
}

/** @type {string[]} */
const vowels = ['a', 'e', 'i', 'o', 'u', 'oo', 'ae', 'ai', 'ee', 'ie', 'ou', 'y',
  'a', 'e', 'o', 'a', 'e', 'i', 'o', 'u', 'é', 'ü',
]
/** @type {string[]} */
const consonants = ['b', 'c', 'd', 'f', 'g', 'h','j', 'k', 'l', 'm', 'n', 'p',
  'r', 's', 't', 'v', 'w', 'x', 'y', 'z', 'ch', 'sh', 'th', 'ph', 'wh',
  'ñ', 'll', 'rr', 'ts', 'ks', 'qu', 'z', 'c', 's', 'j', 'k', 't', 'st'
]

/**
 * Generates a single random name of a given length.
 * @param {number} length
 * @returns {string}
 */
export function generate_single_name(length) {
  let name = ''
  let consonant_probablility = 0.8
  for (let i = 0; i < length; i++) {
    const vowel = Math.random() > consonant_probablility
    if (vowel) {
      name += get_random(vowels)
      consonant_probablility = 0.92
    } else {
      name += get_random(consonants)
      consonant_probablility *= 0.3
    }
  }
  return sentence_case(name)
}

/** @type {string[]} */
const last_names = [
  'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller',
  'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White',
  'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson',
  'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen',
]

/** @type {string[]} */
const adjectives = [
  'Brave', 'Cunning', 'Wise', 'Fierce', 'Noble', 'Swift', 'Bold',
  'Clever', 'Mighty', 'Stealthy', 'Loyal', 'Fearless', 'Valiant',
  'Daring', 'Gallant', 'Witty', 'Resolute', 'Intrepid', 'Vigorous',
  'Tenacious', 'Unyielding', 'Dauntless', 'Heroic', 'Stalwart', 'Indomitable',
  'Unbreakable', 'Unstoppable', 'Invincible', 'Unassailable', 'Unflinching',
  'Hairy', 'Scruffy', 'Tall', 'Heated', 'Calamitous', 'Jewel-encrusted',
  'Quadratic', 'Portly', 'Liquid', 'Meat-filled', 'Toad-lovin\'',
  'Matted', 'Ruffled', 'Tangled', 'Wild', 'Unkempt', 'Disheveled',
  'Unruly', 'Frizzy', 'Kinky', 'Curly', 'Wavy', 'Straight', 'Sleek', 'Glossy',
  'Shiny', 'Radiant', 'Lustrous', 'Sparkling', 'Glittering', 'Gleaming', 'Shimmering',
  'Dazzling', 'Brilliant', 'Luminous', 'Incandescent', 'Resplendent',
]

/**
 * Generates a full random name, possibly with adjectives and last names.
 * @returns {string}
 */
export function generate_name() {
  const names = []

  const gets_leading_adjective = Math.random() < 0.3
  if (gets_leading_adjective) names.push(get_random(adjectives))

  let length = rand_between(2, 4)
  const gets_long_name = Math.random() < 0.2
  if (gets_long_name) length += rand_between(1, 3)
  const christian_name = generate_single_name(length)
  names.push(christian_name)

  const gets_last_name = Math.random() < 0.7
  const gets_hyphenated_last_name = Math.random() < 0.2
  let last_name
  if (gets_last_name) last_name = get_random(last_names)
  if (gets_last_name && gets_hyphenated_last_name) {
    last_name += '-' + get_random(last_names)
  }
  if (last_name) names.push(last_name)

  const gets_trailing_adjective = Math.random() < 0.2
  if (gets_trailing_adjective) names.push('the ' + get_random(adjectives))

  return names.join(' ')
}