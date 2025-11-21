const scriptName = "节点链路检查";
const time = 5000;
let ys = $argument.ys;
function fetchData(url, node) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("timeout")), time);
    const options = node ? { url, node } : { url };

    $httpClient.get(options, (err, resp, data) => {
      clearTimeout(timer);
      if (err) return reject(err);
      try { resolve(JSON.parse(data)); }
      catch (e) { reject(e); }
    });
  });
}

(async () => {
  try {
    const { node, nodeInfo } = $environment.params;
    const nodeIp = nodeInfo.address;

    let myip = "", inInfo = "", outInfo = "";

    const pMy = fetchData("https://api.live.bilibili.com/xlive/web-room/v1/index/getIpInfo")
      .then(ipcn => {
        console.log("本机信息\n" + JSON.stringify(ipcn?.data, null, 2));
        myip = ipcn?.code === 0 && ipcn?.data
          ? `本机：${ipcn.data.province} ${ipcn.data.city} ${ipcn.data.isp}`
          : "本机归属地查询失败";
      })
      .catch(() => {
        myip = "本机归属地查询错误";
      });

    const pIn = fetchData(`http://ip-api.com/json/${nodeIp}?lang=zh-CN`)
      .then(inData => {
        console.log("入口信息\n" + JSON.stringify(inData, null, 2));
        inInfo = inData?.status === "success"
          ? `位置：${inData.country} ${inData.regionName === inData.city ? inData.regionName : inData.regionName + ' ' + inData.city}\nIP：${inData.query}\nISP：${inData.isp}`
          : "入口查询失败或超时";
      })
      .catch(() => {
        inInfo = "入口查询错误";
      });

    const pOut = fetchData("http://ip-api.com/json/?lang=zh-CN", node)
      .then(outData => {
        console.log("出口信息\n" + JSON.stringify(outData, null, 2));
        outInfo = outData?.status === "success"
          ? `位置：${outData.country} ${outData.regionName} ${outData.city}\nIP：${outData.query}\nISP：${outData.isp}`
          : "出口查询失败或超时";
      })
      .catch(() => {
        outInfo = "出口查询错误";
      });

    await Promise.all([pMy, pIn, pOut]);

    $done({
      title: scriptName,
      message: `节点：${node}\n\n${myip}\n\n入口信息\n${inInfo}\n\n出口信息\n${outInfo}`
    });

  } catch (err) {
    $done({ title: scriptName, message: "查询失败：" + err.message });
  }
})();