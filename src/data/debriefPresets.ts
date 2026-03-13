/**
 * Post-game debrief presets per archetype.
 * Round 1: Bot reaction (outcome). Round 2: User picks topic → Bot reflects. Round 3: User picks summary → Bot closes.
 */

export type DebriefOutcome = 'human_wins' | 'bot_wins'

export const ROUND1_USER_OPTIONS: readonly string[] = [
  'Well played!',
  'That was intense.',
  'Good game.',
]

export const ROUND2_USER_OPTIONS: readonly string[] = [
  'What did you think of that sequence?',
  'I got lucky on the draw.',
  'Your commitment cards changed everything.',
]

export const ROUND3_USER_OPTIONS: readonly string[] = [
  'I’ll remember that one.',
  'Same time next round?',
  'Thanks for the game.',
]

type Round1Lines = { humanWins: string; botWins: string }
type RoundResponses = readonly [string, string, string]

const ROUND1_BY_ARCHETYPE: Record<string, Round1Lines> = {
  'The Strategist': {
    humanWins: 'Every move mattered. You read the board well.',
    botWins: 'The blueprint worked. Clean finish.',
  },
  'The Gambler': {
    humanWins: 'All or nothing—you went for it. I like that.',
    botWins: 'Fortune favored me this time. Next time could be yours!',
  },
  'The Observer': {
    humanWins: 'I was watching. You stayed calm when it mattered.',
    botWins: 'Patience paid off. Everything revealed itself.',
  },
  'The Storyteller': {
    humanWins: 'Plot twist! You wrote a good ending.',
    botWins: 'Every card told a story. This chapter was mine.',
  },
  'The Mentor': {
    humanWins: 'Good move. You’ve learned well.',
    botWins: 'Experience teaches. We both played our part.',
  },
  'The Competitor': {
    humanWins: 'No mercy—you earned it. Game on.',
    botWins: 'Victory is mine this time. Bring it next round.',
  },
  'The Artist': {
    humanWins: 'Beautiful play. There was poetry in that.',
    botWins: 'Art in motion. This one felt right.',
  },
  'The Joker': {
    humanWins: 'Did you see that coming? I didn’t!',
    botWins: 'Surprise! Life’s too short for boring wins.',
  },
  'The Perfectionist': {
    humanWins: 'Precision matters. Yours was on point.',
    botWins: 'Every detail counted. Flawless execution.',
  },
  'The Philosopher': {
    humanWins: 'Interesting paradox—winning by playing the moment.',
    botWins: 'What does this mean? Perhaps that the game goes on.',
  },
  'The Newcomer': {
    humanWins: 'This is exciting! You’re really good.',
    botWins: 'I’m still learning. That was a blast!',
  },
  'The Traditionalist': {
    humanWins: 'The old ways work—you played them well.',
    botWins: 'Tradition never fails. My grandfather would approve.',
  },
  'The Intuitive': {
    humanWins: 'I had a feeling you’d take it. Trust your instincts.',
    botWins: 'Something told me that was the right play.',
  },
  'The Diplomat': {
    humanWins: 'We’re all friends here. May the best player win—and they did.',
    botWins: 'Good game, everyone. Let’s do it again soon.',
  },
  'The Analyst': {
    humanWins: 'The odds said you had a path. You took it.',
    botWins: 'Statistically speaking, that was the optimal outcome.',
  },
  'The Maverick': {
    humanWins: 'Why play it safe? You didn’t. I respect that.',
    botWins: 'Rules are meant to be bent. Watch this next time.',
  },
  'The Empath': {
    humanWins: 'I understand. We’ve all been there. You came out on top.',
    botWins: 'Feel the flow. This time it went my way.',
  },
  'The Peacemaker': {
    humanWins: 'Peace and cards. Harmony in a good result.',
    botWins: 'Let’s keep it friendly. No hard feelings.',
  },
  'The Challenger': {
    humanWins: 'Bring it on—you did. Next time I’ll be ready.',
    botWins: 'You think you can beat me? Challenge accepted for next game.',
  },
  'The Scholar': {
    humanWins: 'Fascinating strategy. Knowledge is power—you used it.',
    botWins: 'I’ve studied this. Theory met practice today.',
  },
}

const ROUND2_BY_ARCHETYPE: Record<string, RoundResponses> = {
  'The Strategist': [
    'That sequence was the pivot. You built it; I saw it too late.',
    'Luck evens out. What matters is how we responded.',
    'They did. Commitment cards are levers—you pulled at the right time.',
  ],
  'The Gambler': [
    'Sequences are drama. I live for moments like that.',
    'Luck’s part of the game. Makes it fun.',
    'They’re the spice. Can’t have a meal without them.',
  ],
  'The Observer': [
    'It revealed your hand—literally. I was watching.',
    'The draw is one variable. You played the rest.',
    'They shifted the board. We both adapted.',
  ],
  'The Storyteller': [
    'Every card tells a story. That was a good chapter.',
    'Luck’s a character in the tale. You wrote the ending.',
    'Plot devices! They keep the story interesting.',
  ],
  'The Mentor': [
    'Sequences win games. You’re learning.',
    'Luck helps. Skill decides who uses it.',
    'They’re tools. You used yours well.',
  ],
  'The Competitor': [
    'I noticed. Next time I’ll break it earlier.',
    'Luck favors the bold. You were bold.',
    'They’re in the game for a reason. So are we.',
  ],
  'The Artist': [
    'There’s poetry in a clean sequence. You had it.',
    'Luck is color. You painted with it.',
    'They’re part of the composition. Balance matters.',
  ],
  'The Joker': [
    'I thought I had you. Plot twist!',
    'Luck’s the best joke. Nobody sees it coming.',
    'They’re the surprise. I love surprises.',
  ],
  'The Perfectionist': [
    'Precision. You lined them up correctly.',
    'Luck is noise. We play the signal.',
    'They’re high-leverage. You timed yours.',
  ],
  'The Philosopher': [
    'Sequence, order, meaning. You found the thread.',
    'Luck and skill—two sides of the same coin.',
    'They change the game. So do we.',
  ],
  'The Newcomer': [
    'I’m still learning sequences. That was cool!',
    'Luck was on your side. I’ll get it next time!',
    'Those cards are wild. I want to use them like that.',
  ],
  'The Traditionalist': [
    'The old ways: build the run, play the run.',
    'Luck’s always been part of it. We play on.',
    'Tradition includes commitment cards. You honored it.',
  ],
  'The Intuitive': [
    'I had a feeling about that. You felt it too.',
    'Luck, instinct—hard to tell them apart.',
    'They just felt right when you played them.',
  ],
  'The Diplomat': [
    'We both saw it. No hard feelings.',
    'Luck smiles on everyone sometimes.',
    'They’re in the rules. We play by the rules.',
  ],
  'The Analyst': [
    'The math favored that sequence. You executed.',
    'Variance. Over many games it evens out.',
    'Optimal use. Commitment cards have expected value.',
  ],
  'The Maverick': [
    'Conventional wisdom says sequences win. You proved it.',
    'Luck’s for people who need excuses. You didn’t.',
    'They’re there to be broken—or used. You used.',
  ],
  'The Empath': [
    'I felt that turn. You were in the zone.',
    'We’ve all been there. The draw giveth.',
    'They shifted the mood. You rode it.',
  ],
  'The Peacemaker': [
    'Harmony in the play. We both tried.',
    'Luck keeps it fair. Everyone gets some.',
    'They’re part of the game. We play with peace.',
  ],
  'The Challenger': [
    'I saw it. Next time I’ll stop it.',
    'Luck’s not enough. You had more.',
    'They’re weapons. You used yours. I’ll use mine next.',
  ],
  'The Scholar': [
    'I’ve studied that pattern. You applied it.',
    'Variance in the literature. We play the sample.',
    'Theory: commitment cards change equilibria. You did.',
  ],
}

const ROUND3_BY_ARCHETYPE: Record<string, RoundResponses> = {
  'The Strategist': [
    'So will I. The board doesn’t forget.',
    'I’ll be there. Same blueprint, new game.',
    'You’re welcome. It was a good puzzle.',
  ],
  'The Gambler': [
    'Me too. That one had stakes.',
    'Same time, same stakes. Let’s go.',
    'Anytime. Fortune favors the bold.',
  ],
  'The Observer': [
    'Everything reveals itself in the end.',
    'I’ll be watching. Same table.',
    'Patience. We’ll meet again.',
  ],
  'The Storyteller': [
    'Every game’s a story. That was a good one.',
    'Next chapter, same cast. I’m in.',
    'The pleasure was mine. Until the next tale.',
  ],
  'The Mentor': [
    'Experience teaches. You’re learning.',
    'Same time. I’ll be here.',
    'Good game. Learn from this one too.',
  ],
  'The Competitor': [
    'I’ll remember. And I’ll be back.',
    'Game on. Next round.',
    'No mercy next time. Thanks for the fight.',
  ],
  'The Artist': [
    'There was beauty in it. I’ll remember.',
    'Art in motion. Same canvas next time.',
    'You’re welcome. There’s poetry in this.',
  ],
  'The Joker': [
    'I won’t forget. Might crack a joke about it.',
    'Same time. Bring the laughs.',
    'Life’s too short. Thanks for playing.',
  ],
  'The Perfectionist': [
    'Every detail counts. I’ll recall it.',
    'Precision next time. I’m in.',
    'Perfection takes time. Thanks for the game.',
  ],
  'The Philosopher': [
    'What does it mean? We’ll find out next time.',
    'The game goes on. I’ll be there.',
    'Interesting paradox. Thanks for playing.',
  ],
  'The Newcomer': [
    'I’ll remember! That was so fun.',
    'Yes! Same time. I’m still learning.',
    'Thank you! This is exciting.',
  ],
  'The Traditionalist': [
    'The old ways. We’ll honor them again.',
    'Tradition. Same table, next round.',
    'My grandfather would say good game. I do too.',
  ],
  'The Intuitive': [
    'Something tells me we’ll play again.',
    'I have a feeling. Same time.',
    'Trust your instincts. Thanks.',
  ],
  'The Diplomat': [
    'We’re all friends here. I’ll remember.',
    'May the best player win. Next time.',
    'Good game, everyone. Until next time.',
  ],
  'The Analyst': [
    'The odds will balance. I’ll remember this game.',
    'Statistically speaking, we’ll meet again.',
    'Let me calculate: good game. Thanks.',
  ],
  'The Maverick': [
    'Why play it safe? I’ll remember that.',
    'Rules are meant to be bent. Next time.',
    'Watch this. Thanks for the game.',
  ],
  'The Empath': [
    'I understand. We’ve all been there.',
    'Feel the flow. Same time.',
    'We’ve all been there. Thanks.',
  ],
  'The Peacemaker': [
    'Peace and cards. I’ll remember.',
    'Harmony in all things. Next time.',
    'Let’s keep it friendly. Thanks.',
  ],
  'The Challenger': [
    'Bring it on. I’ll remember.',
    'You think you can beat me? Next round.',
    'Challenge accepted. Thanks for the game.',
  ],
  'The Scholar': [
    'Fascinating. I’ve filed it away.',
    'Knowledge is power. Same time.',
    'I’ve studied this. Thanks for the game.',
  ],
}

const DEFAULT_ROUND1: Round1Lines = {
  humanWins: 'Good game. You played well.',
  botWins: 'Good game. Let’s play again sometime.',
}

const DEFAULT_ROUND2: RoundResponses = [
  'It was a key moment. We both felt it.',
  'Luck’s part of the game. We play on.',
  'They always do. That’s the game.',
]

const DEFAULT_ROUND3: RoundResponses = [
  'I’ll remember it too.',
  'Same time, same place.',
  'Thanks for the game.',
]

export function getRound1BotLine(archetype: string, outcome: DebriefOutcome): string {
  const lines = ROUND1_BY_ARCHETYPE[archetype] ?? DEFAULT_ROUND1
  return outcome === 'human_wins' ? lines.humanWins : lines.botWins
}

export function getRound2BotResponse(archetype: string, userOptionIndex: number): string {
  const responses = ROUND2_BY_ARCHETYPE[archetype] ?? DEFAULT_ROUND2
  return responses[Math.min(userOptionIndex, responses.length - 1)] ?? DEFAULT_ROUND2[0]
}

export function getRound3BotResponse(archetype: string, userOptionIndex: number): string {
  const responses = ROUND3_BY_ARCHETYPE[archetype] ?? DEFAULT_ROUND3
  return responses[Math.min(userOptionIndex, responses.length - 1)] ?? DEFAULT_ROUND3[0]
}
