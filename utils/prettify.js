class Prettify {
  BetweenStation(string) {
    try {
      let arr = [];
      let retval = {};
      let data = string.split("~~~~~~~~");

      let nore = data[0].split("~")[5]?.split("<")[0];
      if (nore === "No direct trains found") {
        retval["success"] = false;
        retval["time_stamp"] = Date.now();
        retval["data"] = nore;
        return retval;
      }

      if (
        data[0] === "~~~~~Please try again after some time." ||
        data[0] === "~~~~~From station not found" ||
        data[0] === "~~~~~To station not found"
      ) {
        retval["success"] = false;
        retval["time_stamp"] = Date.now();
        retval["data"] = data[0].replaceAll("~", "");
        return retval;
      }

      data = data.filter(el => el != "");

      for (let i = 0; i < data.length; i++) {
        let data1 = data[i].split("~^");
        if (data1.length === 2) {
          data1 = data1[1].split("~").filter(el => el != "");
          let obj = {};
          let obj2 = {};

          obj["train_no"] = data1[0];
          obj["train_name"] = data1[1];
          obj["source_stn_name"] = data1[2];
          obj["source_stn_code"] = data1[3];
          obj["dstn_stn_name"] = data1[4];
          obj["dstn_stn_code"] = data1[5];
          obj["from_stn_name"] = data1[6];
          obj["from_stn_code"] = data1[7];
          obj["to_stn_name"] = data1[8];
          obj["to_stn_code"] = data1[9];
          obj["from_time"] = data1[10];
          obj["to_time"] = data1[11];
          obj["travel_time"] = data1[12];

          // Fix: Convert running_days string to array of numbers
          obj["running_days"] = data1[13]
            ? data1[13].split("").map(c => parseInt(c))
            : [];

          const standardClasses = ["SL", "3A", "2A", "1A", "CC", "EC"];
          obj["classes"] = data1[15]
            ? data1[15].split(",").filter(c => standardClasses.includes(c))
            : [];

          obj2["train_base"] = obj;
          arr.push(obj2);
        }
      }

      retval["success"] = true;
      retval["time_stamp"] = Date.now();
      retval["data"] = arr;
      return retval;
    } catch (err) {
      console.warn(err.message);
      return { success: false, time_stamp: Date.now(), data: err.message };
    }
  }

  getDayOnDate(DD, MM, YYYY) {
    let date = new Date(YYYY, MM - 1, DD);
    let day = date.getDay(); // 0 = Sunday, 6 = Saturday
    return day === 0 ? 6 : day - 1; // Convert: Mon=0 ... Sun=6
  }

  GetRoute(string) {
    try {
      let data = string.split("~^");
      let arr = [];
      for (let i = 0; i < data.length; i++) {
        let data1 = data[i].split("~").filter(el => el != "");
        let obj = {};
        obj["source_stn_name"] = data1[2];
        obj["source_stn_code"] = data1[1];
        obj["arrive"] = data1[3];
        obj["depart"] = data1[4];
        obj["distance"] = data1[6];
        obj["day"] = data1[7];
        obj["zone"] = data1[9];
        arr.push(obj);
      }
      return { success: true, time_stamp: Date.now(), data: arr };
    } catch (err) {
      console.log(err.message);
      return { success: false, time_stamp: Date.now(), data: err.message };
    }
  }

  LiveStation($) {
    let arr = [];
    $(".name").each((i, el) => {
      let obj = {};
      obj["train_no"] = $(el).text().slice(0, 5);
      obj["train_name"] = $(el).text().slice(5).trim();
      obj["source_stn_name"] = $(el).next("div").text().split("→")[0].trim();
      obj["dstn_stn_name"] = $(el).next("div").text().split("→")[1].trim();
      obj["time_at"] = $(el).parent("td").next("td").text().slice(0, 5);
      obj["detail"] = $(el).parent("td").next("td").text().slice(5);
      arr.push(obj);
    });
    return { success: true, time_stamp: Date.now(), data: arr };
  }

  PnrStatus(string) {
    let retval = {};
    var pattern = /data\s*=\s*({.*?;)/;
    let match = string.match(pattern)[0].slice(7, -1);
    let data = JSON.parse(match);
    retval["success"] = true;
    retval["time_stamp"] = Date.now();
    retval["data"] = data;
    return retval;
  }

  CheckTrain(string) {
    try {
      let data = string.split("~~~~~~~~");
      let obj = {};
      if (data[0] === "~~~~~Please try again after some time." || data[0] === "~~~~~Train not found") {
        return { success: false, time_stamp: Date.now(), data: data[0].replaceAll("~", "") };
      }

      let data1 = data[0].split("~").filter(el => el != "");
      if (data1[1].length > 6) data1.shift();

      obj["train_no"] = data1[1].replace("^", "");
      obj["train_name"] = data1[2];
      obj["from_stn_name"] = data1[3];
      obj["from_stn_code"] = data1[4];
      obj["to_stn_name"] = data1[5];
      obj["to_stn_code"] = data1[6];
      obj["from_time"] = data1[11];
      obj["to_time"] = data1[12];
      obj["travel_time"] = data1[13];
      obj["running_days"] = data1[14]
        ? data1[14].split("").map(c => parseInt(c))
        : [];

      obj["classes"] = data1[15] ? data1[15].split(",") : [];

      data1 = data[1].split("~").filter(el => el != "");
      obj["type"] = data1[11];
      obj["train_id"] = data1[12];
      obj["distance_from_to"] = data1[18];
      obj["average_speed"] = data1[19];

      return { success: true, time_stamp: Date.now(), data: obj };
    } catch (err) {
      console.warn(err.message);
      return { success: false, time_stamp: Date.now(), data: err.message };
    }
  }
}

export default Prettify;
