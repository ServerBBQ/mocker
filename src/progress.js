function showProgress(progress, text = "") { // Remember to print a newline once finished
  process.stdout.cursorTo(0);
  process.stdout.write(text + " " + progress.toFixed(0) + "%" + "    ");
}

module.exports = { showProgress };
