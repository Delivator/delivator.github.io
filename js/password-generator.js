const dic = {
  az: "abcdefghijklmnopqrstuvwxyz",
  AZ: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  dig: "0123456789",
  special: "!#$%&()*+,-.:;<>=?@[]_"
};

const version = "1.4";

const defaultSettings = {
  version: version,
  theme: "light",
  presets: [{
    name: "Default",
    az: true,
    AZ: true,
    dig: true,
    special: false,
    leng: 16,
    additional: "",
    isDefault: true
  }, {
    name: "All",
    az: true,
    AZ: true,
    dig: true,
    special: true,
    leng: 16,
    additional: "",
    isDefault: true
  }, {
    name: "Emoji 🔐",
    az: false,
    AZ: false,
    dig: false,
    special: false,
    leng: 16,
    additional: "😀😁😂🤣😃😄😅😆😉😊😋😎😍😘😗😙😚☺️🙂🤗🤩🤔🤨😐😑😶🙄😏😣😥😮🤐😯😪😫😴😌😛😜😝🤤😒😓😔😕🙃🤑😲☹️🙁😖😞😟😤😢😭😦😧😨😩🤯😬😰😱😳🤪😵😡😠🤬😷🤒🤕🤢🤮🤧😇🤠🤡🤥🤫🤭🧐🤓😈👿👹👺💀👻👽🤖💩😺😸😹😻😼😽🙀😿😾💪👈👉☝️👆🖕👇✌️🤞🖖🤘🖐✋👌👍👎✊👊🤛🤜🤚👋🤟✍️👏👐🙌🤲🙏🤝💅👂👃👣👀👁🧠👅👄💋❤️💛💚💙💜🖤💔❣️💕💞💓💗💖💘💝💟💯",
    isDefault: true
  }]
};

let settings = localStorage.getItem("settings");
let randomDic = "";

function get(id) {
  return document.getElementById(id);
}

function generatePassword(chars, length) {
  let pw = "";
  chars = [...chars];
  for (let i = 0; i < length; i++) {
    pw += chars[Math.floor(Math.random() * chars.length)];
  }
  return pw;
}

let check_az = get("az"),
  check_AZ = get("AZ"),
  check_dig = get("dig"),
  check_special = get("special"),
  leng = get("length"),
  additional = get("additional"),
  select_presets = get("presets"),
  output = get("output"),
  presetName = get("presetName"),
  presetNameInput = get("presetNameInput"),
  characters = get("characters");

output.onclick = () => {
  document.execCommand("copy");
}

output.addEventListener("copy", (event) => {
  event.preventDefault();
  if (event.clipboardData) {
    event.clipboardData.setData("text/plain", output.innerText);
    M.toast({ html: "Password copied to clipboard!", classes: "green", displayLength: 3000 });
  }
});

function saveSettings() {
  localStorage.setItem("settings", JSON.stringify(settings));
}

function loadPreset(preset) {
  if (!preset) preset = settings.presets[presets.selectedIndex];
  check_az.checked = preset.az;
  check_AZ.checked = preset.AZ;
  check_dig.checked = preset.dig;
  check_special.checked = preset.special;
  leng.value = preset.leng;
  additional.value = preset.additional;
  generate();
  M.updateTextFields();
}

function loadPresets() {
  presets.innerHTML = "";
  for (let i = 0; i < settings.presets.length; i++) {
    let option = document.createElement("option");
    option.text = settings.presets[i].name;
    select_presets.add(option, i)
  }
  M.FormSelect.init(presets);
}

function updateDic() {
  randomDic = "";
  if (check_az.checked) randomDic += dic.az;
  if (check_AZ.checked) randomDic += dic.AZ;
  if (check_dig.checked) randomDic += dic.dig;
  if (check_special.checked) randomDic += dic.special;
  if (additional.value) randomDic += additional.value;
}

function textToHTML(text) {
  if (text.length > 1000) return text;
  text = [...text];
  let formattedHTML = "";

  text.forEach(c => {
    if (dic.dig.includes(c)) {
      formattedHTML += '<span class="number">' + c + '</span>';
    } else if (!(dic.az + dic.AZ).includes(c) && !dic.dig.includes(c)) {
      formattedHTML += '<span class="special">' + c + '</span>';
    } else {
      formattedHTML += c;
    }
  });
  return formattedHTML;
}

function generate() {
  updateDic();
  characters.innerText = randomDic;
  if (randomDic === "") return M.toast({ html: "Used characters can't be empty!", classes: "red" });
  if (leng.value < 1 || leng.value > 100000) return M.toast({ html: "Password length can be 1-100000 characters long!", classes: "red" });
  let pw = generatePassword(randomDic, leng.value);
  output.innerHTML = textToHTML(pw);
}

function reset() {
  localStorage.clear();
  location.reload();
}

function addPreset() {
  let modal = M.Modal.getInstance(get("addPresetModal"));
  let name = presetNameInput.value;
  if (name === "") {
    M.toast({ html: "Preset name can't be empty!", classes: "red" });
    return;
  } else {
    let preset = {
      name: name,
      az: check_az.checked,
      AZ: check_AZ.checked,
      dig: check_dig.checked,
      special: check_special.checked,
      leng: leng.value,
      additional: additional.value
    };
    settings.presets.push(preset);
    saveSettings();
    loadPreset(settings.presets[settings.presets.length - 1]);
    loadPresets();
    presets.value = name;
    M.FormSelect.init(presets);
    generate();
    M.toast({ html: name + " has been added to the presets!", classes: "green" });
    presetNameInput.value = "";
    M.updateTextFields();
    modal.close();
  }
}

function removePreset() {
  let name = settings.presets[presets.selectedIndex].name;
  presetName.innerText = "name";
  settings.presets.splice(presets.selectedIndex, 1);
  saveSettings();
  loadPreset(settings.presets[0]);
  loadPresets();
  presets.value = settings.presets[0].name;
  M.FormSelect.init(presets);
  generate();
  M.toast({ html: name + " has been removed from the presets!", classes: "red" });
}

function updateModalText() {
  let modal = M.Modal.getInstance(get("removePresetModal"));
  let name = settings.presets[presets.selectedIndex].name;
  if (settings.presets[presets.selectedIndex].isDefault) {
    M.toast({ html: "You can't delte default presets!", classes: "red" });
    return;
  }
  presetName.innerText = name;
  modal.open();
}

function loadTheme() {
  if (settings.theme === "dark") {
    get("dark-theme").disabled = false;
  } else {
    get("dark-theme").disabled = true;
  }
}

function toggleTheme() {
  if (settings.theme === "dark") {
    settings.theme = "light";
    saveSettings();
    loadTheme();
  } else {
    settings.theme = "dark";
    saveSettings();
    loadTheme();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  M.AutoInit();

  if (!settings) {
    settings = defaultSettings;
    saveSettings();
  } else {
    settings = JSON.parse(localStorage.getItem("settings"));
    if (settings.version != version) {
      settings = defaultSettings;
      saveSettings();
      M.toast({ html: "Version updated. Settings resetted!", classes: "yellow darken-2", displayLength: 10000 });
    }
  }

  loadPreset(settings.presets[0]);
  loadPresets();
  generate();
  loadTheme();
});
