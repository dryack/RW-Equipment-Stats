// ==UserScript==
// @name        Torn RW Equipment Stats
// @namespace   lamashtu.rw_equipment_stats
// @match       https://www.torn.com/item.php*
// @match       https://www.torn.com/factions.php?step=your#/tab=armoury*
// @match       https://www.torn.com/displaycase.php*
// @downloadURL https://github.com/dryack/RW-Equipment-Stats/raw/main/rw-equip-stats.user.js
// @updateURL   https://github.com/dryack/RW-Equipment-Stats/raw/main/rw-equip-stats.user.js
// @version     1.3.9
// @author      lamashtu
// @description Track RQ equipment stats in Torn's UI
// @grant       unsafeWindow
// ==/UserScript==

//     Collect and display information regarding Ranked War equipment.
//     Copyright (C) 2022 Endless Endeavor
//
//     This program is free software: you can redistribute it and/or modify
//     it under the terms of the GNU Affero General Public License as published
//     by the Free Software Foundation, either version 3 of the License, or
//     (at your option) any later version.
//
//     This program is distributed in the hope that it will be useful,
//     but WITHOUT ANY WARRANTY; without even the implied warranty of
//     MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//     GNU Affero General Public License for more details.
//
//     You should have received a copy of the GNU Affero General Public License
//     along with this program.  If not, see <https://www.gnu.org/licenses/>.

// UI modification came from sportsp, without whom this script would still be languishing

const settings = {
    tornApiKey: '',
    ttl: 30, // TTL for cached data, in minutes
    apiComment: 'TornRWEqStats',
    collectMundane: false, // pull information on non-RW items?
    breakoutArmorCoverages: true, // display individual body part coverages?
};

function setObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
}

function getObject(key) {
    let value = localStorage.getItem(key);
    return value && JSON.parse(value);
}

// populating the Extras array in the UI
function appendExtra(title, value, obj, objType = "text") {
  if (value > 0 && value !== undefined) {
    obj['extras'].push({
      type: objType,
      title: title,
      value: value.toString(), // TODO: is toString() simply unnecessary? indications point to yes
    })
  }
}

(async function() {

 const oldAjax = $.ajax; // proxy
  $.ajax = (...args) => {
    // sometimes args[0] is an url because jquery sucks, torn doesn't use this though
    // when there's no armouryID, we also want to pass through
    if (typeof args[0] === "string" || !args[0].url.includes("inventory.php") || args[0].data.armouryID === undefined) {
        return oldAjax(...args); // pass through
  }

  const callback = args[0].success || function () {}; // or empty function
  args[0].success = (data) => {
    //console.log(args[0])
    let obj = JSON.parse(data);
    //debugger;

    // having to use a massive if/else here blows, but trying to dump out of the function with a guard statement was failing so w/e
    const armoryID = obj['armoryID'].toString();
    if (obj.glow === "" && !settings.collectMundane) { // not a RW item
        callback(JSON.stringify(obj));
    } else if (armoryID === "false") {
        callback(JSON.stringify(obj));
    } else {
        if (getObject('apiData') === null) {
            let apiData = {};
            setObject('apiData', apiData);
        }
        let apiData = getObject('apiData');

        if (!(armoryID in apiData)) {
            apiData[armoryID] = {};
        }

        // collect non-api data, including the obnoxious hovertext-only stuff
        let numBonuses = 0;
        for (const itemInfo of obj.extras) {
        switch (itemInfo.title) {
          case "Damage":
            apiData[armoryID]['damage'] = parseFloat(itemInfo.value);
            break;
          case "Accuracy":
            apiData[armoryID]['accuracy'] = parseFloat(itemInfo.value);
            break;
          case "Stealth":
            apiData[armoryID]['stealth'] = parseFloat(itemInfo.value);
            break;
          case "Quality":
            apiData[armoryID]['quality'] = parseFloat(itemInfo.value.replace("%", ""));
            apiData[armoryID]['color'] = itemInfo.colorOverlay;
            break;
          case "Bonus":
            numBonuses += 1;
            apiData[armoryID]["bonus" + numBonuses] = itemInfo.value;
            apiData[armoryID]["bonus_quality" + numBonuses] = itemInfo.descTitle;
            break;
          case "Armor":
            apiData[armoryID]['armor'] = parseFloat(itemInfo.value);
            break;
          case "Coverage":
            let coverages = itemInfo.descTitle.split("<b>");
            coverages.shift();
            for (const location of coverages) {
              let splitStr = location.split(":");
              const locationName = splitStr[0].toLowerCase().replace(/ /g, "_");
              apiData[armoryID][locationName] = parseFloat(splitStr[1].replace("%", "").replace("</b>", "").replace("</br>", "").trim());
            }
        }
      }

        // TODO: consider pre-creating all fields as undefined, simplifying appendExtra()
        logData(armoryID, apiData).then(response => {
            if (response !== undefined) {
              apiData[armoryID]['epoch'] = Math.floor(new Date().getTime() / 1000.0)
              apiData[armoryID]['first_owner'] = response.itemstats.stats.first_owner || 0
              apiData[armoryID]['respect_earned'] = response.itemstats.stats.respect_earned || 0
              apiData[armoryID]['highest_damage'] = response.itemstats.stats.highest_damage || 0
              apiData[armoryID]['time_created'] = response.itemstats.stats.time_created || 0
              apiData[armoryID]['total_dmg'] = response.itemstats.stats.damage || 0
              apiData[armoryID]['rounds_fired'] = response.itemstats.stats.rounds_fired || 0
              apiData[armoryID]['hits'] = response.itemstats.stats.hits || 0
              apiData[armoryID]['misses'] = response.itemstats.stats.misses || 0
              apiData[armoryID]['reloads'] = response.itemstats.stats.reloads || 0
              apiData[armoryID]['finishing_hits'] = response.itemstats.stats.finishing_hits || 0
              apiData[armoryID]['critical_hits'] = response.itemstats.stats.critical_hits || 0
              apiData[armoryID]['damage_taken'] = response.itemstats.stats.damage_taken || 0
              apiData[armoryID]['hits_received'] = response.itemstats.stats.hits_received || 0
              apiData[armoryID]['most_damage_taken'] = response.itemstats.stats.most_damage_taken || 0
              apiData[armoryID]['damage_mitigated'] = response.itemstats.stats.damage_mitigated || 0
              apiData[armoryID]['most_damage_mitigated'] = response.itemstats.stats.most_damage_mitigated || 0
              setObject('apiData', apiData);
            } else {
              apiData = getObject('apiData');
            }

            // populating of the Extra array of objects is done without a loop to allow control of the order each item will
            // be displayed
            if (settings.breakoutArmorCoverages) {
                appendExtra("Full Body Coverage", apiData[armoryID].full_body_coverage, obj)
                appendExtra("Groin Coverage", apiData[armoryID].groin_coverage, obj)
                appendExtra("Leg Coverage", apiData[armoryID].leg_coverage, obj)
                appendExtra("Foot Coverage", apiData[armoryID].foot_coverage, obj)
                appendExtra("Stomach Coverage", apiData[armoryID].stomach_coverage, obj)
                appendExtra("Arm Coverage", apiData[armoryID].arm_coverage, obj)
                appendExtra("Heart Coverage", apiData[armoryID].heart_coverage, obj)
                appendExtra("Chest Coverage", apiData[armoryID].chest_coverage, obj)
                appendExtra("Throat Coverage", apiData[armoryID].throat_coverage, obj)
                appendExtra("Hand Coverage", apiData[armoryID].hand_coverage, obj)
                appendExtra("Head Coverage", apiData[armoryID].head_coverage, obj)
            }

            appendExtra("ArmoryID", armoryID, obj)
            appendExtra("First Owner", apiData[armoryID].first_owner, obj)
            if (apiData[armoryID].time_created > 0) {
              let epochInMS = apiData[armoryID].time_created * 1000
              let createDate = new Date(epochInMS).toLocaleString([], {
                year: 'numeric',
                month: 'numeric',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              });
              obj['extras'].push({
                type: "text",
                title: "Created",
                value: createDate.toString()
              });
            }

            appendExtra("Respect Earned", apiData[armoryID].respect_earned, obj)
            appendExtra("Highest Damage", apiData[armoryID].highest_damage, obj)
            appendExtra("Damage", apiData[armoryID].total_dmg, obj)
            appendExtra("Rds Fired", apiData[armoryID].rounds_fired, obj)
            appendExtra("Hits", apiData[armoryID].hits, obj)
            appendExtra("Misses", apiData[armoryID].misses, obj)
            appendExtra("Reloads", apiData[armoryID].reloads, obj)
            appendExtra("Finishing", apiData[armoryID].finishing_hits, obj)
            appendExtra("Crits", apiData[armoryID].critical_hits, obj)
            appendExtra("Dmg Taken", apiData[armoryID].damage_taken, obj)
            appendExtra("Hits Recv'd", apiData[armoryID].hits_received, obj)
            appendExtra("Max Dmg Taken", apiData[armoryID].most_damage_taken, obj)
            appendExtra("Dmg Mitigated", apiData[armoryID].damage_mitigated, obj)
            appendExtra("Max Mitigated", apiData[armoryID].most_damage_mitigated, obj)

            callback(JSON.stringify(obj));
          });
    }
  };
  return oldAjax(...args);
}})();

async function logData(armoryID, apiData) {
    if ('epoch' in apiData[armoryID]) {
      const now = Math.floor(new Date().getTime()/1000.0);

      if (now - apiData[armoryID].epoch <= (settings.ttl * 60)) {
        return Promise.resolve();
      }
    }

   try {
      const equipmentStats = await getEquipmentData(armoryID);
      console.log("api request");
      return equipmentStats;
    }
    catch (error) {
        alert('Something bad happened.\n\nTorn API says: ' + error.message);
    }
}

function getEquipmentData(id) {
    // work off this to avoid pulling data for non-RW items
    // if (itemIdsToFetch.length === 0) {
    //     return Promise.resolve();
    // }
    const queryString = 'https://api.torn.com/torn/' + id + '?selections=itemstats&key=' + settings.tornApiKey + "&comment=" + settings.apiComment;
    return fetch(queryString)
        .then(response => response.json())
        .then(response => {
            if (response === undefined) {
              throw Error((response.error && response.error.error) || 'Unknown error');

            }
            return response;
        });
}
