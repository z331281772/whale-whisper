/**
 * Whale-caption generator — Claude-style spinner captions for the native
 * TurnStatus "Deep diving..." row. Structure learned from Claude Code's
 * official spinner verbs (187): "Verb-ing + whimsical object + ...", never
 * describing the real task, concise and absurd.
 *
 * Usage:  node generate-captions.mjs [count]
 * Output: captions.json (zh/en aligned), dict-zh.txt, dict-en.txt
 *
 * To add themes later: add entries to POOL (zhPrefix/enPrefix + objects),
 * rerun, then paste the dict fragments into the ui-conversation bundle and
 * bump DDN_CAPTION_COUNT there.
 */

const POOL = [
  // ---- "给…X" prefix forms (Claude-style butler/wizard chores) ----
  { zh: "给{}充电", en: "Charging the {}", objects: [["水母", "jellyfish"], ["灯塔", "lighthouse"], ["灯笼鱼", "lanternfish"], ["电鳗", "electric eel"], ["鲸歌", "whale song"]] },
  { zh: "给{}写信", en: "Writing to the {}", objects: [["灯塔", "lighthouse"], ["月亮", "the moon"], ["海鸥", "seagulls"], ["漂流瓶", "a message in a bottle"], ["海面", "the sea surface"]] },
  { zh: "给{}梳头", en: "Brushing the {}", objects: [["珊瑚", "coral"], ["海藻", "seaweed"], ["水母", "jellyfish"], ["海马", "seahorse"], ["鲸须", "baleen"]] },
  { zh: "给{}擦窗", en: "Wiping the {}'s windows", objects: [["沉船", "shipwreck"], ["灯塔", "lighthouse"], ["望远镜", "spyglass"], ["漂流瓶", "message bottle"]] },
  { zh: "给{}涂防晒", en: "Sunscreening the {}", objects: [["海星", "starfish"], ["海龟", "sea turtle"], ["小丑鱼", "clownfish"], ["海豚", "dolphins"], ["海豹", "seal"]] },
  { zh: "给{}画航线", en: "Charting the {}'s route", objects: [["海龟", "sea turtle"], ["鲑鱼", "salmon"], ["灯塔", "lighthouse"], ["座头鲸", "humpback"]] },
  { zh: "给{}写谱", en: "Scoring the {}", objects: [["鲸歌", "whale song"], ["海豚", "dolphins"], ["海风", "sea breeze"], ["潮汐", "tides"]] },
  { zh: "给{}贴面膜", en: "Masking the {}", objects: [["月亮", "moon"], ["水母", "jellyfish"], ["珊瑚", "coral"], ["海参", "sea cucumber"]] },
  { zh: "给{}系领结", en: "Tying the {}'s bowtie", objects: [["螃蟹", "crab"], ["龙虾", "lobster"], ["寄居蟹", "hermit crab"], ["企鹅", "penguin"], ["灯笼鱼", "lanternfish"]] },
  { zh: "给{}换灯泡", en: "Changing the {}'s bulb", objects: [["灯塔", "lighthouse"], ["灯笼鱼", "lanternfish"], ["水母", "jellyfish"], ["潜水艇", "submarine"]] },
  { zh: "给{}编辫子", en: "Braiding the {}", objects: [["章鱼", "octopus"], ["海藻", "seaweed"], ["水母", "jellyfish"], ["海蛇", "sea snake"]] },
  { zh: "哄{}睡觉", en: "Tucking the {} in", objects: [["珊瑚", "coral"], ["海星", "starfish"], ["小丑鱼", "clownfish"], ["寄居蟹", "hermit crab"], ["磷虾", "krill"]] },
  { zh: "教{}唱歌", en: "Teaching the {} to sing", objects: [["海豚", "dolphins"], ["小丑鱼", "clownfish"], ["沙丁鱼", "sardines"], ["海鸥", "seagulls"], ["水母", "jellyfish"]] },
  { zh: "教{}走直线", en: "Teaching the {} to walk straight", objects: [["螃蟹", "crab"], ["龙虾", "lobster"], ["寄居蟹", "hermit crab"], ["章鱼", "octopus"]] },
  { zh: "偷听{}开会", en: "Eavesdropping on the {} meeting", objects: [["水母", "jellyfish"], ["海豚", "dolphins"], ["章鱼", "octopus"], ["海鸥", "seagulls"], ["海龟", "sea turtle"]] },
  { zh: "偷听{}说梦话", en: "Listening to the {}'s sleep talk", objects: [["灯塔", "lighthouse"], ["沉船", "shipwreck"], ["月亮", "moon"], ["鲸鱼", "whale"]] },
  { zh: "陪{}数腿", en: "Counting the {}'s legs", objects: [["章鱼", "octopus"], ["螃蟹", "crab"], ["海星", "starfish"], ["水母", "jellyfish"]] },
  { zh: "帮{}搬家", en: "Helping the {} move", objects: [["寄居蟹", "hermit crab"], ["海龟", "sea turtle"], ["章鱼", "octopus"], ["贝壳", "shells"]] },
  { zh: "给{}让路", en: "Making way for the {}", objects: [["渔船", "fishing boat"], ["货轮", "cargo ship"], ["海龟", "sea turtle"], ["冲浪者", "surfer"]] },
  { zh: "等{}下班", en: "Waiting for the {} to clock off", objects: [["灯塔", "lighthouse"], ["月亮", "moon"], ["海鸥", "seagulls"], ["沙丁鱼", "sardines"]] },

  // ---- direct verb forms ----
  { zh: "数{}", en: "Counting the {}", objects: [["水母", "jellyfish"], ["磷虾", "krill"], ["沙丁鱼", "sardines"], ["泡泡圈", "bubble rings"], ["海鸥", "seagulls"]] },
  { zh: "搅拌{}", en: "Stirring the {}", objects: [["海水", "sea"], ["海带汤", "kelp soup"], ["潮汐", "tides"], ["漩涡", "whirlpool"], ["墨汁", "squid ink"]] },
  { zh: "叠{}", en: "Folding the {}", objects: [["海浪", "waves"], ["水花", "spray"], ["渔网", "fishing net"], ["海平线", "horizon"]] },
  { zh: "晒{}", en: "Drying the {}", objects: [["月亮", "moon"], ["海藻", "seaweed"], ["渔网", "fishing net"], ["海盐", "sea salt"], ["水母", "jellyfish"]] },
  { zh: "遛{}", en: "Walking the {}", objects: [["海马", "seahorse"], ["寄居蟹", "hermit crab"], ["海龟", "sea turtle"], ["电鳗", "electric eel"]] },
  { zh: "查阅{}", en: "Consulting the {}", objects: [["海图", "sea charts"], ["航海日志", "logbook"], ["潮汐表", "tide table"], ["鲸鱼族谱", "whale family tree"], ["海洋法典", "ocean code"]] },
  { zh: "排练{}", en: "Rehearsing the {}", objects: [["鲸歌", "whale song"], ["喷水柱", "spout"], ["鱼群队形", "school formation"], ["海豚体操", "dolphin routine"]] },
  { zh: "擦亮{}", en: "Polishing the {}", objects: [["珍珠", "pearls"], ["灯塔", "lighthouse"], ["望远镜", "spyglass"], ["贝壳", "shells"], ["海盐", "sea salt"]] },
  { zh: "洗{}", en: "Washing the {}", objects: [["海藻", "seaweed"], ["渔网", "fishing net"], ["沉船甲板", "shipwreck deck"], ["鲸须", "baleen"], ["贝壳", "shells"]] },
  { zh: "吹{}", en: "Blowing the {}", objects: [["泡泡圈", "bubble rings"], ["螺号", "conch"], ["季风", "monsoon"], ["海盐", "sea salt"]] },
  { zh: "梳理{}", en: "Combing the {}", objects: [["鲸须", "baleen"], ["海藻", "seaweed"], ["水母触手", "jellyfish tentacles"], ["海流", "currents"]] },
  { zh: "煮{}", en: "Simmering the {}", objects: [["海带汤", "kelp soup"], ["海水", "sea water"], ["贝壳浓汤", "shell chowder"], ["海底捞", "deep-sea hotpot"], ["海藻沙拉", "seaweed salad"]] },
  { zh: "量{}", en: "Measuring the {}", objects: [["海水深度", "sea depth"], ["浪高", "wave height"], ["潮汐", "tides"], ["回声", "echoes"], ["自己的身长", "my own length"]] },
  { zh: "喂{}", en: "Feeding the {}", objects: [["磷虾", "krill"], ["海鸥", "seagulls"], ["沙丁鱼", "sardines"], ["水母", "jellyfish"], ["小丑鱼", "clownfish"]] },
  { zh: "打捞{}", en: "Fishing up the {}", objects: [["珍珠", "pearls"], ["沉船宝藏", "shipwreck treasure"], ["漂流瓶", "message bottles"], ["月亮", "moon"]] },
  { zh: "泡{}", en: "Soaking the {}", objects: [["海带", "kelp"], ["贝壳", "shells"], ["珍珠", "pearls"], ["水母", "jellyfish"]] }
];

/** Blacklist: combos that read wrong. Format "动作中文|宾语中文" or "enPrefix|objectEn". */
const BLACKLIST = new Set([
  "吹{}|海盐", "Blowing the {}|sea salt",
  "泡{}|珍珠", "Soaking the {}|pearls",
  "给{}换灯泡|水母", "Changing the {}'s bulb|jellyfish",
  "给{}贴面膜|水母", "Masking the {}|jellyfish",
  "给{}编辫子|水母", "Braiding the {}|jellyfish",
  "给{}写信|海面", "Writing to the {}|sea surface",
  "数{}|海鸥", "Counting the {}|seagulls",
  "喂{}|水母", "Feeding the {}|jellyfish",
  "教{}唱歌|水母", "Teaching the {}|jellyfish",
  "哄{}睡觉|磷虾", "Tucking the {}|krill",
  "给{}梳头|鲸须", "Brushing the {}|baleen"
]);

/** Post-generation fixes for grammar collisions ("the my own", "the a …"). */
const POSTFIX = new Map([
  ["Measuring the my own length", "Measuring my own length"],
  ["Writing to the a message in a bottle", "Writing to a message in a bottle"]
]);

const ALLOWED = process.argv[2] ? Number(process.argv[2]) : 120;

const combos = [];
for (const entry of POOL) {
  for (const [objZh, objEn] of entry.objects) {
    const zh = entry.zh.replace("{}", objZh);
    let en = entry.en.replace("{}", objEn);
    if (BLACKLIST.has(`${entry.zh}|${objZh}`) || BLACKLIST.has(`${entry.en}|${objEn}`)) continue;
    en = POSTFIX.get(en) ?? en;
    combos.push({ zh: `${zh}…`, en: `${en}...`, objZh, entryZh: entry.zh });
  }
}

// Theme budget: each object appears at most 3 times; each action at most 8.
const byObj = new Map();
const byAction = new Map();
const pick = [];
const shuffled = combos.sort(() => Math.random() - 0.5);
for (const c of shuffled) {
  const o = (byObj.get(c.objZh) ?? 0);
  const a = (byAction.get(c.entryZh) ?? 0);
  if (o >= 3 || a >= 8) continue;
  byObj.set(c.objZh, o + 1);
  byAction.set(c.entryZh, a + 1);
  pick.push(c);
  if (pick.length >= ALLOWED) break;
}

const zhLines = [];
const enLines = [];
pick.forEach((c, i) => {
  const key = `turnStatus.caption.${String(i).padStart(2, "0")}`;
  zhLines.push(`\t\t\t"${key}": "${c.zh}",`);
  enLines.push(`\t\t\t"${key}": "${c.en}",`);
});
import fs from "node:fs";
fs.writeFileSync("captions.json", JSON.stringify({ zh: pick.map(c => c.zh), en: pick.map(c => c.en) }, null, 2));
fs.writeFileSync("dict-zh.txt", zhLines.join("\n") + "\n");
fs.writeFileSync("dict-en.txt", enLines.join("\n") + "\n");
console.log(`generated ${pick.length} captions (target ${ALLOWED})`);
console.log(`objects used: ${byObj.size}, max per object: ${Math.max(...byObj.values())}`);
console.log(`actions used: ${byAction.size}, max per action: ${Math.max(...byAction.values())}`);
console.log("\n--- zh preview ---");
console.log(pick.slice(0, 12).map(c => c.zh).join(" | "));
console.log("\n--- en preview ---");
console.log(pick.slice(0, 12).map(c => c.en).join(" | "));
