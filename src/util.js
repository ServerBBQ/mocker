function formatNumber(num, precision = 2) {
  const map = [
    { suffix: "T", threshold: 1e12 },
    { suffix: "B", threshold: 1e9 },
    { suffix: "M", threshold: 1e6 },
    { suffix: "K", threshold: 1e3 },
    { suffix: "", threshold: 1 },
  ];

  const found = map.find((x) => Math.abs(num) >= x.threshold);
  if (found) {
    const withoutTrailingZeros = parseFloat(
      (num / found.threshold).toFixed(precision)
    );
    const formatted = withoutTrailingZeros + found.suffix;
    return formatted;
  }

  return num;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function splitArrayIntoPieces(arr, x) {
  if (x <= 0) {
    throw new Error('The value of x must be greater than zero.');
  }
  
  const result = [];
  const length = arr.length;
  const pieceSize = Math.ceil(length / x);

  arr = [...arr] //prevent arr being set to [] on outside code

  for (let i = 0; i < x; i++) {
    const piece = arr.splice(0, pieceSize);
    result.push(piece);
  }

  return result;
}

module.exports = { formatNumber, sleep, splitArrayIntoPieces };
