jubo-iot
====

基于Meteor的IoT网关，支持Alljoyn和DDP协议。

### 设备定义
```
device: {
  "about": {"name": "xxx"},
  "type": "bulb", 	      	// bulb、media、sensor
  "devid": "xxxx-xxx-xxxx", 	// generate by gateway
  "connector": "ddp",			// ddp、alljoyn、mqtt
  "location": "home.kitchen",
  "status": "on",				// on、off
  "startTime": "doom",		// doom(device is off) or start time
  "statusColor": "#00ba00",
  "icon": "lighting-bulb.svg",
  "controller": "jubo@bulbControl", // the device's exclusive 
}
```

## 属性定义
```
property: {
  "devid": "xxxx-xxx-xxxx",
  'pid': 'xxx-xxx-xxxx',
  "service": "lighting",
  "property": "lightState",
  "value": "on",
  
  "label": "开关",
  'role': 'founder' // founder,citizen
  
  "friends": [{"friend": "id", "friendship": "1"}, ...],
  "rules": [{"pid": "id", "value": "xxx-xxxx"}]
}

relationship: {
  "me": "pid",
  "friend": "pid",
  "friendship": "1",
  "tie": 'property.value'  
}

```

