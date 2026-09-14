export type PronunciationAlignment = {
  expectedWords: string[];
  heardWords: string[];
  matchedWords: string[];
  missingWords: string[];
  coveragePercent: number;
};

function words(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9'\s-]/g, " ")
    .split(/[\s-]+/)
    .map((word) => word.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}

// This is deliberately transcript alignment, not a pronunciation score. Browser
// speech recognition does not expose the acoustic detail required to judge sounds.
export function alignTranscriptToPhrase(
  expected: string,
  transcript: string,
): PronunciationAlignment {
  const expectedWords = words(expected);
  const heardWords = words(transcript);
  const table = Array.from({ length: expectedWords.length + 1 }, () =>
    Array<number>(heardWords.length + 1).fill(0),
  );

  for (let expectedIndex = expectedWords.length - 1; expectedIndex >= 0; expectedIndex -= 1) {
    for (let heardIndex = heardWords.length - 1; heardIndex >= 0; heardIndex -= 1) {
      table[expectedIndex][heardIndex] =
        expectedWords[expectedIndex] === heardWords[heardIndex]
          ? 1 + table[expectedIndex + 1][heardIndex + 1]
          : Math.max(table[expectedIndex + 1][heardIndex], table[expectedIndex][heardIndex + 1]);
    }
  }

  const matchedWords: string[] = [];
  let expectedIndex = 0;
  let heardIndex = 0;
  while (expectedIndex < expectedWords.length && heardIndex < heardWords.length) {
    if (expectedWords[expectedIndex] === heardWords[heardIndex]) {
      matchedWords.push(expectedWords[expectedIndex]);
      expectedIndex += 1;
      heardIndex += 1;
    } else if (table[expectedIndex + 1][heardIndex] >= table[expectedIndex][heardIndex + 1]) {
      expectedIndex += 1;
    } else {
      heardIndex += 1;
    }
  }

  const matchedCounts = new Map<string, number>();
  for (const word of matchedWords) matchedCounts.set(word, (matchedCounts.get(word) ?? 0) + 1);
  const missingWords = expectedWords.filter((word) => {
    const remaining = matchedCounts.get(word) ?? 0;
    if (remaining <= 0) return true;
    matchedCounts.set(word, remaining - 1);
    return false;
  });

  return {
    expectedWords,
    heardWords,
    matchedWords,
    missingWords,
    coveragePercent: expectedWords.length === 0 ? 0 : Math.round((matchedWords.length / expectedWords.length) * 100),
  };
}
