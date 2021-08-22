const s = "3|1|2".split("|");
let x = 0;
while (true) {
  switch (s[x++]) {
    case "1":
      const a = 1;
      continue;
    case "2":
      const b = 3;
      continue;
    case "3":
      const c = 0;
      continue;
  }
  break;
}
