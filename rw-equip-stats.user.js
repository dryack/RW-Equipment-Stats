// ==UserScript==
// @name        Torn RW Equipment Stats
// @namespace   lamashtu.rw_equipment_stats
// @match       https://www.torn.com/item.php
// @match       https://www.torn.com/factions.php?step=your#/tab=armoury
// @updateURL   https://github.com/dryack/RW-Equipment-Stats/rw-equip-stats.user.js
// @version     1.2
// @author      lamashtu
// @description Track RQ equipment stats in Torn's UI
// @grant       unsafeWindow
// ==/UserScript==

// UI modification came from sportsp, without whom this script would still be languishing

const settings = {
    tornApiKey: '',
};

function setObject(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
};

function getObject(key) {
    var value = localStorage.getItem(key);
    return value && JSON.parse(value);
};

(async function() {
 const oldAjax = $.ajax; // proxy
  $.ajax = (...args) => {
    // sometimes args[0] is a url because jquery sucks, torn doesn't use this though
    // when there's no armouryID, we also want to pass through
    if (typeof args[0] === "string" || !args[0].url.includes("inventory.php") || args[0].data.armouryID === undefined) {
        return oldAjax(...args); // pass through
  }
  const callback = args[0].success || function () {}; // or empty function
  args[0].success = (data) => {
    //console.log(args[0])
    let obj = JSON.parse(data);
    const armoryID = obj['armoryID'].toString();

    if (getObject('apiData') === null) {
      let apiData = {};
      setObject('apiData', apiData);
    };
    let apiData = getObject('apiData');

    if (!(armoryID in apiData)) {
      apiData[armoryID] = {};
    };

    logData(armoryID, apiData).then(response => {
      if (response === undefined) {
        let apiData = getObject('apiData');
      } else {
        apiData[armoryID]['epoch'] = Math.floor(new Date().getTime()/1000.0)
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
      }


      //debugger;
      obj['extras'].push({
        type: "text",
        title: "WeaponID",
        value: armoryID,
      });

      obj['extras'].push({
        type: "text",
        title: "FirstOwner",
        value: apiData[armoryID].first_owner.toString(),
      });

      if (apiData[armoryID].time_created > 0 ) {
        let epochInMS = apiData[armoryID].time_created * 1000
        let createDate = new Date(epochInMS).toLocaleString([],{year: 'numeric', month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
        obj['extras'].push({
          type: "text",
          title: "Created",
          value: createDate.toString()
        });
      };

      if (apiData[armoryID].respect_earned > 0) {
        obj['extras'].push({
          type: "text",
          title: "Respect Earned",
          value: apiData[armoryID].respect_earned.toString(),
        });
      };

      if (apiData[armoryID].highest_damage > 0) {
        obj['extras'].push({
          type: "text",
          title: "Highest Damage",
          value: apiData[armoryID].highest_damage.toString(),
        });
      };

      if (apiData[armoryID].total_dmg > 0) {
        obj['extras'].push({
          type: "text",
          title: "Damage",
          value: apiData[armoryID].total_dmg.toString(),
        });
      };

      if (apiData[armoryID].rounds_fired > 0) {
        obj['extras'].push({
          type: "text",
          title: "Rds Fired",
          value: apiData[armoryID].rounds_fired.toString(),
        });
      };

      if (apiData[armoryID].hits > 0) {
        obj['extras'].push({
          type: "text",
          title: "Hits",
          value: apiData[armoryID].hits.toString(),
        });
      };

      if (apiData[armoryID].misses > 0) {
        obj['extras'].push({
          type: "text",
          title: "Misses",
          value: apiData[armoryID].misses.toString(),
        });
      };

      if (apiData[armoryID].reloads > 0) {
        obj['extras'].push({
          type: "text",
          title: "Reloads",
          value: apiData[armoryID].reloads.toString(),
        });
      };

      if (apiData[armoryID].finishing_hits > 0) {
        obj['extras'].push({
          type: "text",
          title: "Finishing",
          value: apiData[armoryID].finishing_hits.toString(),
        });
      };

      if (apiData[armoryID].critical_hits > 0) {
        obj['extras'].push({
          type: "text",
          title: "Crits",
          value: apiData[armoryID].critical_hits.toString(),
        });
      };

      if (apiData[armoryID].damage_taken > 0) {
        obj['extras'].push({
          type: "text",
          title: "Dmg Taken",
          value: apiData[armoryID].damage_taken.toString(),
        });
      };

      if (apiData[armoryID].hits_received > 0) {
        obj['extras'].push({
          type: "text",
          title: "Hits Recv'd",
          value: apiData[armoryID].hits_received.toString(),
        });
      };

      if (apiData[armoryID].most_damage_taken > 0) {
        obj['extras'].push({
          type: "text",
          title: "Max Dmg Taken",
          value: apiData[armoryID].most_damage_taken.toString(),
        });
      };

      if (apiData[armoryID].damage_mitigated > 0) {
        obj['extras'].push({
          type: "text",
          title: "Dmg Mitigated",
          value: apiData[armoryID].damage_mitigated.toString(),
        });
      };

      if (apiData[armoryID].most_damage_mitigated > 0) {
        obj['extras'].push({
          type: "text",
          title: "Max Mitigated",
          value: apiData[armoryID].most_damage_mitigated.toString(),
        });
      };

      callback(JSON.stringify(obj));
    });
  };
  return oldAjax(...args);
}})();

async function logData(armoryID, apiData) {
    if ('epoch' in apiData[armoryID]) {
      const now = Math.floor(new Date().getTime()/1000.0);
      //30 min ttl
      if (now - apiData[armoryID].epoch <= 1800) {
        return Promise.resolve();
      }
    };

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
    const queryString = 'https://api.torn.com/torn/' + id + '?selections=itemstats&key=' + settings.tornApiKey;
    return fetch(queryString)
        .then(response => response.json())
        .then(response => {
            if (response === undefined) {
              throw Error((response.error && response.error.error) || 'Unknown error');

            }
            return response;
        });
}
